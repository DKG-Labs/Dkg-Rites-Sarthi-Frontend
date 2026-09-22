import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  generateFinalProductCertificate,
  generateRailpadIcDetails,
  getFinalIcEditData,
  getProcessIcEditData,
} from '../services/certificateService';
import { fetchCorrectionSlip, fetchCorrectionSlipDocument, getViewCorrectionSlipPdfUrl } from '../services/correctionSlipService';
import { getStoredUser } from '../services/authService';
import Notification from './Notification';
import CorrectionSlipPDF, { formatCorrectionText } from './CorrectionSlipPDF';

/* ─── Per-IC-type field maps (sourced from backend DTOs & IC templates) ─── */
const PROCESS_FIELD_MAP = {
  certificateNo:          'Certificate No.',
  certificateDate:        'Certificate Date',
  bookNo:                 'Book No.',
  setNo:                  'Set No.',
  offeredInstNo:          'Offered Instt. No.',
  passedInstNo:           'Passed Instt. No.',
  contractor:             'Contractor',
  manufacturer:           'Manufacturer',
  placeOfInspection:      'Place of Inspection',
  contractRef:            'Contract Ref.',
  billPayingOfficer:      'Bill Paying Officer',
  consignee:              'Consignee (Railway)',
  consigneeRailway:       'Consignee (Railway)',
  consigneeManufacturer: 'Consignee (Manufacturer of finished Product)',
  purchasingAuthority:    'Purchasing Authority (Railway)',
  description:            'Description',
  drgNo:                  'Drg. No.',
  drawingNo:              'Drg. No.',
  specNo:                 'Spec. No.',
  qapNo:                  'QAP No.',
  typeOfInspection:       'Type of inspection/tests conducted',
  chpClNo:                'CHP CL. No. Of QAP',
  lotNo:                  'Lot No.',
  qtyNowOffered:          'Total Processed Qty (Nos.)',
  qtyNowPassed:           'Accepted Qty (Nos.)',
  qtyNowRejected:         'Rejected Qty (Nos.)',
  quantityNowPassedText:  'Remark',
  reasonsForRejection:    'Reason of Rejection',
  dateOfCall:             'Date of call',
  noOfVisits:             'Total No. of Man-days engaged',
  datesOfInspection:      'Date of inspection',
  sealingPattern:         'Pattern of sealing/stamping or identification',
  inspectingEngineer:     'Inspecting Engineer',
};

const FINAL_FIELD_MAP = {
  certificateNo:          'Certificate No.',
  certificateDate:        'Certificate Date',
  bookNo:                 'Book No.',
  setNo:                  'Set No.',
  offeredInstNo:          'Offered Instt. No.',
  passedInstNo:           'Passed Instt. No.',
  contractor:             'Contractor',
  placeOfInspection:      'Place of Inspection',
  contractRef:            'Contract References',
  maNumberAndDate:        'MA Number & Date',
  billPayingOfficer:      'Bill Paying Officer',
  consignee:              'Consignee',
  consigneeRailway:       'Consignee (Railway)',
  purchasingAuthority:    'Purchasing Authority',
  itemNo:                 'Item No.',
  description:            'Description of Stores',
  drawingNo:              'Drawing No.',
  specNo:                 'Specification No.',
  qtyOnOrder:             'Quantity on Order',
  qtyOfferedPreviously:   'Cumulative Qty Offered Previously',
  qtyPassedPreviously:    'Qty Prev Passed',
  qtyNowOffered:          'Qty Now Offered',
  qtyNowPassed:           'Qty Now Passed',
  qtyNowRejected:         'Qty Now Rejected',
  qtyStillDue:            'Qty Still Due',
  quantityNowPassedText:  'Quantity Now Passed (Text)',
  remarks:                'Remarks',
  noOfItemsChecked:       'No. of items checked',
  dateOfCall:             'Date of call',
  noOfVisits:             'No. of Visits',
  datesOfInspection:      'Date(s) of inspection',
  inspectionDates:        'Date(s) of inspection',
  trRecDate:              'TR Rec. dt.',
  sealingPattern:         'Pattern of sealing/stamping & location of seal/stamp/sticker',
  facsimileText:          'Facsimile of seal/stamp/sticker',
  reasonsForRejection:    'Reason of rejection',
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
        <span style={{ fontSize: '9px', color: '#6b7280', flexShrink: 0 }}>▼</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
            background: '#fff', border: '1px solid #d1d5db', borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 1300, overflow: 'hidden',
          }}
        >
          <div style={{ padding: '6px 8px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search field..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '4px 8px', fontSize: '12px',
                border: '1px solid #d1d5db', borderRadius: '4px', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '8px 12px', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
                No fields match
              </div>
            )}
            {filtered.map(opt => (
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
    width: '100%', padding: '6px 9px', border: '1px solid #d1d5db',
    borderRadius: '6px', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box',
    minHeight: '34px', color: '#1f2937', fontFamily: 'inherit', lineHeight: '1.4',
    resize: 'vertical',
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
  const [storedDoc, setStoredDoc] = useState(null);

  const callNo = row?.call_no || row?.requestId || row?.callNo || row?.icNo || '';
  const currentUser = getStoredUser();

  const showNotif = useCallback((message, type = 'info') => {
    setNotification({ message, type });
  }, []);

  const formatDateVal = (val) => {
    if (!val) return '';
    if (typeof val === 'string' && (/^\d{2}\/\d{2}\/\d{4}$/.test(val.trim()) || /^\d{2}\.\d{2}\.\d{4}$/.test(val.trim()))) return val.trim();
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return String(val);
    }
  };

  /* Load IC Certificate data */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setIcError('');
      try {
        // 1. Fetch base certificate particulars from backend / mock
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
        const rawCertNo = certData?.certificateNo || certData?.certNo || certData?.icNumber || certData?.icNo;
        const candidateKeys = Array.from(new Set([
          rawCertNo,
          callNo,
          row?.certificateNo,
          row?.icNo,
          row?.callNo,
          row?.call_no,
          row?.requestId
        ].filter(Boolean)));

        const isProcess = String(callNo || '').toUpperCase().startsWith('RPP') ||
          String(row?.product_type || row?.productType || row?.railPadType || '').toLowerCase().includes('process');

        let editData = null;

        for (const key of candidateKeys) {
          try {
            if (isProcess) {
              if (!editData) {
                const eRes = await getProcessIcEditData(key);
                if (eRes && (eRes.icNumber || eRes.bookNo || eRes.consignee || eRes.contractor || eRes.drgNo || eRes.specNo)) {
                  editData = eRes;
                }
              }
            } else {
              if (!editData) {
                const eRes = await getFinalIcEditData(key);
                if (eRes && (eRes.icNumber || eRes.bookNo || eRes.consignee || eRes.contractor || eRes.manufacturer)) {
                  editData = eRes;
                }
              }
            }
          } catch { /* ignore */ }
        }

        // Cross-check fallback if not found with primary type assumption
        if (!editData) {
          for (const key of candidateKeys) {
            try {
              const eRes = isProcess ? await getFinalIcEditData(key) : await getProcessIcEditData(key);
              if (eRes && (eRes.icNumber || eRes.bookNo || eRes.consignee || eRes.contractor)) {
                editData = eRes;
                break;
              }
            } catch { /* ignore */ }
          }
        }

        const merged = {
          ...(row || {}),
          ...(certData || {}),
          ...(editData || {})
        };

        const certNo = editData?.icNumber || certData?.certificateNo || certData?.certNo || merged.certificateNo || merged.icNumber || merged.icNo || callNo;
        const certDate = formatDateVal(editData?.certificateDate) || formatDateVal(editData?.createdAt) || formatDateVal(certData?.certificateDate) || formatDateVal(row?.createdDate) || '';

        const normalizedData = {
          ...merged,
          certificateNo: certNo,
          certificateDate: certDate,
          contractor: editData?.contractor || editData?.manufacturer || certData?.contractor || certData?.contractorName || row?.vendorName || row?.vendorCode || merged.contractor || '',
          manufacturer: editData?.manufacturer || editData?.contractor || certData?.manufacturer || certData?.contractor || row?.vendorName || merged.manufacturer || '',
          placeOfInspection: editData?.placeOfInspection || certData?.placeOfInspection || row?.vendorAddress || merged.placeOfInspection || '',
          contractRef: editData?.contractRef || certData?.contractRef || certData?.contractReferences || row?.poNo || merged.contractRef || '',
          maNumberAndDate: editData?.maNumberAndDate || certData?.maNumberAndDate || row?.maNumberAndDate || merged.maNumberAndDate || '',
          billPayingOfficer: editData?.billPayingOfficer || certData?.billPayingOfficer || merged.billPayingOfficer || '',
          consignee: editData?.consignee || certData?.consignee || certData?.consigneeRailway || merged.consignee || 'Senior Section Engineer (P.Way)',
          consigneeRailway: editData?.consigneeRailway || editData?.consignee || certData?.consigneeRailway || certData?.consignee || merged.consigneeRailway || merged.consignee || '',
          consigneeManufacturer: editData?.consigneeManufacturer || certData?.consigneeManufacturer || editData?.contractor || merged.consigneeManufacturer || '',
          purchasingAuthority: editData?.purchasingAuthority || certData?.purchasingAuthority || merged.purchasingAuthority || 'PCMM/Rly',
          itemNo: editData?.itemNo || certData?.itemNo || merged.itemNo || '001',
          description: editData?.description || certData?.description || certData?.descriptionOfStores || row?.productType || row?.railPadType || merged.description || 'Grooved Rubber Sole Plates',
          drawingNo: editData?.drgNo || editData?.drawingNo || certData?.drawingNo || certData?.drgNo || row?.drawingNo || merged.drawingNo || '',
          drgNo: editData?.drgNo || editData?.drawingNo || certData?.drawingNo || certData?.drgNo || row?.drawingNo || merged.drgNo || '',
          specNo: editData?.specNo || certData?.specNo || merged.specNo || 'IRS T-55-2025',
          qapNo: editData?.qapNo || certData?.qapNo || merged.qapNo || '',
          typeOfInspection: editData?.typeOfInspection || certData?.typeOfInspection || merged.typeOfInspection || 'Verification of Invoices of Raw materials, weighment of Raw material, witnessing the activities during mixing at Kneader & mixing mill, sheeting/sizing, rheometer test, verification of mould dimensions & surface, monitoring of moulding activities at hydraulic press & finishing as per the frequency specified in PIO detailed under Annexure-A of Rly. Bd. Letter No. 2024/RS(G)/779/12 Dtd.16.10.2025',
          chpClNo: editData?.chpClNo || certData?.chpClNo || merged.chpClNo || 'Process inspection as per PIO detailed under Annexure-A of Rly. Bd. Letter No. 2024/RS(G)/779/12 Dtd.16.10.2025 & Approved QAP',
          lotNo: editData?.lotNo || certData?.lotNo || row?.lotNumbers || row?.lotNo || merged.lotNo || '',
          qtyOnOrder: editData?.qtyOnOrder ?? (certData?.qtyOnOrder ?? certData?.quantityOnOrder ?? row?.orderedQty ?? merged.qtyOnOrder ?? 0),
          qtyOfferedPreviously: editData?.qtyOfferedPreviously ?? (certData?.qtyOfferedPreviously ?? certData?.cumulativeQtyOfferedPreviously ?? merged.qtyOfferedPreviously ?? 'NIL'),
          qtyPassedPreviously: editData?.qtyPassedPreviously ?? (certData?.qtyPassedPreviously ?? certData?.qtyPrevPassed ?? merged.qtyPassedPreviously ?? 'NIL'),
          qtyNowOffered: editData?.qtyNowOffered ?? (certData?.qtyNowOffered ?? row?.totalQty ?? row?.offeredQty ?? merged.qtyNowOffered ?? 0),
          qtyNowPassed: editData?.qtyNowPassed ?? (certData?.qtyNowPassed ?? row?.acceptedQty ?? row?.passedQty ?? merged.qtyNowPassed ?? 0),
          qtyNowRejected: editData?.qtyNowRejected ?? (certData?.qtyNowRejected ?? row?.rejectedQty ?? merged.qtyNowRejected ?? 'NIL'),
          qtyStillDue: editData?.qtyStillDue ?? (certData?.qtyStillDue ?? merged.qtyStillDue ?? 'NIL'),
          quantityNowPassedText: editData?.quantityNowPassedText || certData?.quantityNowPassedText || certData?.quantityNowPassedInWords || merged.quantityNowPassedText || '',
          remarks: editData?.remarks || certData?.remarks || merged.remarks || '',
          noOfItemsChecked: editData?.noOfItemsChecked || certData?.noOfItemsChecked || merged.noOfItemsChecked || 'ONE',
          dateOfCall: formatDateVal(editData?.dateOfCall) || formatDateVal(certData?.dateOfCall) || formatDateVal(row?.createdDate) || merged.dateOfCall || '',
          noOfVisits: editData?.noOfVisits || certData?.noOfVisits || merged.noOfVisits || '',
          datesOfInspection: editData?.datesOfInspection || certData?.datesOfInspection || certData?.dateOfInspection || merged.datesOfInspection || '',
          inspectionDates: editData?.datesOfInspection || certData?.inspectionDates || certData?.datesOfInspection || certData?.dateOfInspection || merged.inspectionDates || '',
          trRecDate: editData?.trRecDate || certData?.trRecDate || merged.trRecDate || '',
          sealingPattern: editData?.sealingPattern || certData?.sealingPattern || merged.sealingPattern || (isProcess ? 'NA' : 'RITES HOLOGRAM SEAL'),
          facsimileText: editData?.facsimileText || certData?.facsimileText || merged.facsimileText || (isProcess ? 'NA' : 'RITES HOLOGRAM SEAL'),
          reasonsForRejection: (editData?.reasonsForRejection && editData.reasonsForRejection !== 'Not Applicable') ? editData.reasonsForRejection : (certData?.reasonsForRejection || certData?.reasonOfRejection || merged.reasonsForRejection || 'N/A'),
          inspectingEngineer: editData?.inspectingEngineer || certData?.inspectingEngineer || currentUser?.userName || merged.inspectingEngineer || 'Inspecting Engineer',
          bookNo: editData?.bookNo || certData?.bookNo || merged.bookNo || '001',
          setNo: editData?.setNo || certData?.setNo || merged.setNo || '001',
          offeredInstNo: editData?.offeredInstNo || editData?.installmentNo || certData?.offeredInstNo || certData?.offeredInsttNo || merged.offeredInstNo || (isProcess ? '' : '1'),
          passedInstNo: editData?.passedInstNo || certData?.passedInstNo || certData?.passedInsttNo || merged.passedInstNo || (isProcess ? '' : '1ST & FINAL'),
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

  /* Restore saved corrections and check stored document */
  useEffect(() => {
    const restore = async () => {
      try {
        const doc = await fetchCorrectionSlipDocument(callNo);
        if (doc && doc.exists) {
          setStoredDoc(doc);
        }
      } catch (e) {
        console.warn('Error checking stored correction slip document:', e);
      }

      const saved = await fetchCorrectionSlip(callNo);
      if (saved && saved.length > 0) {
        setCorrections(saved.map(s => ({
          id: Date.now() + Math.random(),
          columnName: s.columnName || s.column_name || '',
          readAs: formatCorrectionText(s.readAs || s.read_as || ''),
          insteadOf: formatCorrectionText(s.insteadOf || s.instead_of || ''),
        })));
      }
    };
    if (callNo) restore();
  }, [callNo]);

  const productType = (() => {
    const call = String(callNo || row?.requestId || row?.call_no || row?.callNo || '').toUpperCase().trim();
    const pt = String(row?.product_type || row?.productType || row?.railPadType || icData?.callType || '').toLowerCase().trim();
    if (call.startsWith('RPP') || call.includes('/RPP') || call.includes('-RPP') || pt.includes('process') || pt.includes('proc')) return 'PROCESS';
    if (call.startsWith('RPF') || call.includes('/RPF') || call.includes('-RPF') || pt.includes('final') || pt.includes('fp')) return 'FINAL';
    return call.startsWith('RPP') ? 'PROCESS' : 'FINAL';
  })();

  /* Build Section 1 key-value pairs (always include installment rows for process even if blank) */
  const icFields = icData
    ? Object.entries(getFieldMap(productType))
        .filter(([key]) => {
          if (productType === 'PROCESS' && (key === 'offeredInstNo' || key === 'passedInstNo')) return true;
          const val = icData[key];
          return val !== undefined && val !== null && val !== '' && !Array.isArray(val);
        })
        .map(([key, label]) => ({ key, label, value: icData[key] !== undefined && icData[key] !== null ? String(icData[key]) : '' }))
    : [];

  /* ── Row helpers ── */
  const updateRow = (id, field, value) => {
    setCorrections(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === 'columnName') {
        const found = icFields.find(f => f.key === value);
        const val = found ? found.value : (icData && icData[value] ? String(icData[value]) : '—');
        const formattedVal = formatCorrectionText(val);
        updated.insteadOf = formattedVal;
        if (!updated.readAs || updated.readAs.trim() === '') {
          updated.readAs = formattedVal;
        }
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
      if (!r.insteadOf.trim()) {
        showNotif(`Row ${i + 1}: "Instead Of" value cannot be empty.`, 'error');
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {storedDoc && (
              <button
                type="button"
                onClick={() => window.open(getViewCorrectionSlipPdfUrl(callNo), '_blank')}
                style={{
                  padding: '6px 12px',
                  background: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="View stored correction slip PDF in Azure"
              >
                📄 View Stored PDF
              </button>
            )}
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
                      <td style={{ ...S.tdVal, whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{value}</td>
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
                  <th style={{ ...S.th, width: '30%' }}>Column Name</th>
                  <th style={{ ...S.th, width: '32%' }}>Read As</th>
                  <th style={{ ...S.th, width: '32%' }}>Instead Of</th>
                  <th style={{ ...S.th, width: '6%' }}>✕</th>
                </tr>
              </thead>
              <tbody>
                {corrections.map((corr) => (
                  <tr key={corr.id}>
                    <td style={{ ...S.td, padding: '6px 8px', verticalAlign: 'top' }}>
                      <FieldDropdown
                        options={icFields}
                        hiddenKeys={HIDDEN_DROPDOWN_KEYS}
                        value={corr.columnName}
                        onChange={(val) => updateRow(corr.id, 'columnName', val)}
                        disabled={loading || !!icError}
                      />
                    </td>
                    <td style={{ ...S.td, padding: '6px 8px', verticalAlign: 'top' }}>
                      <textarea
                        rows={corr.readAs && corr.readAs.includes('\n') ? Math.min(Math.max(corr.readAs.split('\n').length, 2), 8) : 2}
                        style={S.inputBase}
                        placeholder="Enter corrected value"
                        value={corr.readAs}
                        onChange={(e) => updateRow(corr.id, 'readAs', e.target.value)}
                        onFocus={e => { e.target.style.borderColor = '#3b82f6'; }}
                        onBlur={e => { e.target.style.borderColor = '#d1d5db'; }}
                      />
                    </td>
                    <td style={{ ...S.td, padding: '6px 8px', verticalAlign: 'top' }}>
                      <textarea
                        rows={corr.insteadOf && corr.insteadOf.includes('\n') ? Math.min(Math.max(corr.insteadOf.split('\n').length, 2), 8) : 2}
                        style={S.inputBase}
                        placeholder="Enter instead of value"
                        value={corr.insteadOf}
                        onChange={(e) => updateRow(corr.id, 'insteadOf', e.target.value)}
                        onFocus={e => { e.target.style.borderColor = '#3b82f6'; }}
                        onBlur={e => { e.target.style.borderColor = '#d1d5db'; }}
                      />
                    </td>
                    <td style={{ ...S.td, padding: '6px 8px', textAlign: 'center', verticalAlign: 'top' }}>
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
