import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import {
  getFinalIcEditData
} from '../services/certificateService';
import { fetchCorrectionSlip, fetchCorrectionSlipDocument, getViewCorrectionSlipPdfUrl } from '../services/correctionSlipService';
import { getStoredUser } from '../services/authService';
import Notification from './Notification';
import CorrectionSlipPDF, { formatCorrectionText } from './CorrectionSlipPDF';

/* ─── Sleeper Final IC (SF) field map ─── */
const SLEEPER_FIELD_MAP = {
  certificateNo:          'Certificate No.',
  certificateDate:        'Certificate Date',
  bookNo:                 'Book No.',
  setNo:                  'Set No.',
  offeredInstNo:          'Offered Instt. No.',
  passedInstNo:           'Passed Instt. No.',
  contractor:             'Contractor',
  placeOfInspection:      'Place of Inspection',
  contractRef:            'Contract Reference',
  maNumberAndDate:        'MA Number & Date',
  billPayingOfficer:      'Bill Paying Officer',
  consignee:              'Consignee',
  purchasingAuthority:    'Purchasing Authority',
  itemNo:                 'Item No.',
  description:            'Description of stores',
  qtyOnOrder:             'Quantity on order',
  qtyOfferedPreviously:   'Cumulative qty. offered previously',
  qtyPassedPreviously:    'Quantity previously passed',
  qtyNowOffered:          'Qty now offered',
  qtyNowPassed:           'Qty now passed',
  qtyNowRejected:         'Qty now rejected',
  qtyStillDue:            'Qty still due',
  quantityNowPassedText:  'Quantity Now Passed (Text)',
  noOfItemsChecked:       'No. of items checked',
  dateOfCall:             'Date of call',
  noOfVisits:             'No. of Visits',
  datesOfInspection:      'Date(s) of Inspection',
  trRecDate:              'TR Rec. dt.',
  sealingPattern:         'Pattern of sealing/stamping & location of seal/stamp/sticker',
  facsimileText:          'Facsimile of seal/stamp/sticker',
  reasonsForRejection:    'Reason of rejection',
  inspectingEngineer:     'Inspecting Engineer',
  remarks:                'Remarks',
};

const HIDDEN_DROPDOWN_KEYS = [
  'certificateNo',
  'certificateDate',
  'bookNo',
  'setNo',
];

const emptyRow = () => ({ columnName: '', readAs: '', insteadOf: '', id: Date.now() + Math.random() });

/* ─── Custom Field Dropdown ─── */
const FieldDropdown = ({ options, hiddenKeys = [], value, onChange, disabled, placeholder = '— Select field —' }) => {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  const searchRef = useRef(null);

  const selected = options.find(o => o.key === value);
  const filtered = options.filter(o => !hiddenKeys.includes(o.key) && o.label.toLowerCase().includes(search.toLowerCase()));

  const handleToggle = () => {
    if (disabled) return;
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 260);
    }
    setOpen(v => !v);
  };

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
        onClick={handleToggle}
        style={{
          width: '100%', height: '38px', padding: '0 12px',
          background: disabled ? '#f8fafc' : '#ffffff',
          border: `1.5px solid ${open ? '#3b82f6' : '#cbd5e1'}`,
          borderRadius: '8px', fontSize: '13px', fontWeight: '500',
          color: selected ? '#0f172a' : '#94a3b8',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          boxShadow: open ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
          {selected ? selected.label : placeholder}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: openUpward ? 'auto' : 'calc(100% + 4px)',
          bottom: openUpward ? 'calc(100% + 4px)' : 'auto',
          left: 0,
          zIndex: 99999,
          background: '#ffffff',
          border: '1.5px solid #dbeafe',
          borderRadius: '8px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          maxHeight: '250px',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          minWidth: '240px',
        }}>
          <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search fields..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', height: '30px', padding: '0 10px',
                border: '1px solid #cbd5e1', borderRadius: '6px',
                fontSize: '12px', outline: 'none', boxSizing: 'border-box', color: '#1e293b',
              }}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1, maxHeight: '180px' }}>
            <div
              onClick={() => { onChange(''); setSearch(''); setOpen(false); }}
              style={{
                padding: '8px 12px', fontSize: '12.5px', color: '#94a3b8',
                cursor: 'pointer', fontStyle: 'italic',
                borderBottom: '1px solid #f8fafc',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              — Select field —
            </div>
            {filtered.length === 0 ? (
              <div style={{ padding: '12px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
                No fields found
              </div>
            ) : filtered.map(opt => (
              <div
                key={opt.key}
                onClick={() => { onChange(opt.key); setSearch(''); setOpen(false); }}
                style={{
                  padding: '8px 12px', fontSize: '12.5px',
                  cursor: 'pointer', fontWeight: value === opt.key ? '600' : '400',
                  color: value === opt.key ? '#1d4ed8' : '#334155',
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

/* ─── Styles (Identical to Railpad / ERC S styles) ─── */
const S = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
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

const CorrectionSlipModal = ({ row = {}, onClose }) => {
  const callNo = row?.requestId || row?.call_no || row?.callNo || row?.id || '';
  const [icData, setIcData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [icError, setIcError] = useState('');
  const [corrections, setCorrections] = useState([emptyRow()]);
  const [showPDF, setShowPDF] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [notif, setNotif] = useState({ msg: '', type: '' });
  const [storedDoc, setStoredDoc] = useState(null);

  const currentUser = getStoredUser();

  const showNotif = (msg, type = 'info') => setNotif({ msg, type });

  const formatDateVal = (val) => {
    if (!val) return '';
    if (typeof val === 'string' && /^\d{2}\.\d{2}\.\d{4}$/.test(val.trim())) return val.trim();
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}.${month}.${year}`;
    } catch {
      return String(val);
    }
  };

  /* Fetch IC data for this call */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setIcError('');

        let icBackend = null;
        try {
          const res = await apiService.getSleeperIc(callNo);
          icBackend = res?.data || res?.responseData || res;
        } catch { /* ignore */ }

        const candidateKeys = Array.from(new Set([
          icBackend?.certificateNo,
          icBackend?.icNo,
          callNo,
          row?.certificateNo,
          row?.icNo,
          row?.callNo,
          row?.call_no,
          row?.requestId
        ].filter(Boolean)));

        let editData = null;

        for (const key of candidateKeys) {
          try {
            if (!editData) {
              const eRes = await getFinalIcEditData(key);
              if (eRes && (eRes.icNumber || eRes.bookNo || eRes.consignee || eRes.manufacturer)) {
                editData = eRes;
              }
            }
          } catch { /* ignore */ }
        }

        const merged = {
          ...(row || {}),
          ...(icBackend || {}),
          ...(editData || {})
        };

        const certNo = editData?.icNumber || icBackend?.certificateNo || merged.certificateNo || merged.icNumber || merged.icNo || callNo;
        const certDate = formatDateVal(editData?.createdAt) || formatDateVal(icBackend?.date) || formatDateVal(merged.certificateDate) || formatDateVal(row?.createdDate);

        let finalDesc = editData?.description || icBackend?.descriptionOfStores || merged.description || 'MANUFACTURE AND SUPPLY OF PRESTRESSED MONO-BLOCK CONCRETE LINE SLEEPERS';
        if (finalDesc && (finalDesc.includes('/') || /^[A-Z0-9-]+\/\d+/i.test(finalDesc))) {
          finalDesc = finalDesc
            .replace(/^CALL NO:\s*[^,]+,\s*PO SR NO:\s*\S+\s*-\s*/i, '')
            .replace(/^[A-Z0-9-]+\/\d+\s*-\s*/i, '')
            .replace(/^PO SR NO:?\s*\d+\s*-\s*/i, '')
            .replace(/^PO SR NO\s+\d+\s*-\s*/i, '');
          finalDesc = `PO SR NO ${icBackend?.itemNo || '001'} - ${finalDesc}`;
        }

        const normalizedData = {
          ...merged,
          certificateNo: certNo,
          certificateDate: certDate,
          bookNo: editData?.bookNo || icBackend?.bookNo || merged.bookNo || '',
          setNo: editData?.setNo || icBackend?.setNo || merged.setNo || '',
          offeredInstNo: editData?.offeredInstallmentNo || editData?.offeredInstNo || (icBackend?.offeredInstallmentNumber ? String(icBackend.offeredInstallmentNumber) : (merged.offeredInstNo || '1')),
          passedInstNo: editData?.passedInstallmentNo || editData?.passedInstNo || (icBackend?.passedInstallmentNumber ? String(icBackend.passedInstallmentNumber) : (merged.passedInstNo || '1ST & FINAL')),
          contractor: editData?.manufacturer || editData?.contractor || icBackend?.contractor || merged.contractor || row?.vendorName || '',
          placeOfInspection: editData?.placeOfInspection || editData?.manufacturer || icBackend?.placeOfInspection || merged.placeOfInspection || row?.plantId || '',
          contractRef: editData?.contractRef || icBackend?.contractRefAndDate || merged.contractRef || row?.poNo || '',
          maNumberAndDate: editData?.maNumberAndDate || icBackend?.maNumberAndDate || merged.maNumberAndDate || '',
          billPayingOfficer: editData?.billPayingOfficer || icBackend?.billPayingOffice || merged.billPayingOfficer || '',
          consignee: editData?.consignee || icBackend?.consignee || merged.consignee || '',
          purchasingAuthority: editData?.purchasingAuthority || icBackend?.purchasingAuthority || merged.purchasingAuthority || '',
          itemNo: icBackend?.itemNo || merged.itemNo || '001',
          description: finalDesc,
          qtyOnOrder: icBackend?.quantityOnOrder ?? (merged.qtyOnOrder ?? merged.quantityOnOrder ?? row?.orderedQty ?? ''),
          qtyOfferedPreviously: editData?.cummQtyOfferedPrev || icBackend?.cumulativeQtyOfferedPreviously || (merged.qtyOfferedPreviously ?? 'NIL'),
          qtyPassedPreviously: editData?.qtyPrevPassed || icBackend?.quantityPreviouslyPassed || (merged.qtyPrevPassed ?? 'NIL'),
          qtyNowOffered: editData?.qtyNowOffered ?? (icBackend?.qtyNowOffered ?? (merged.qtyNowOffered ?? row?.offeredQty ?? '')),
          qtyNowPassed: editData?.qtyNowPassed ?? (icBackend?.qtyNowPassed ?? (merged.qtyNowPassed ?? row?.acceptedQty ?? '')),
          qtyNowRejected: editData?.qtyNowRejected ?? (icBackend?.qtyNowRejected ?? (merged.qtyNowRejected ?? '0')),
          qtyStillDue: editData?.qtyStillDue || icBackend?.qtyStillDue || (merged.qtyStillDue ?? ''),
          quantityNowPassedText: editData?.quantityNowPassedText || icBackend?.quantityNowPassedBatchNos || merged.quantityNowPassedText || '',
          remarks: editData?.remarks || merged.remarks || '',
          noOfItemsChecked: editData?.noOfItemsChecked || icBackend?.noOfItemsChecked || merged.noOfItemsChecked || '1',
          dateOfCall: icBackend?.dateOfCall || editData?.dateOfCall || formatDateVal(row?.createdDate) || '',
          noOfVisits: editData?.noOfVisits || (icBackend?.noOfVisits ? String(icBackend.noOfVisits) : (merged.noOfVisits || '1')),
          datesOfInspection: editData?.datesOfInspection || formatDateVal(icBackend?.dateOfInspection) || formatDateVal(merged.datesOfInspection) || '',
          trRecDate: editData?.trRecDate || icBackend?.trRecDate || merged.trRecDate || '',
          sealingPattern: editData?.sealingPattern || icBackend?.sealingPattern || merged.sealingPattern || 'RITES Stencil marked on the top surface of each PSC sleeper in presence of vendor.',
          facsimileText: editData?.facsimileText || icBackend?.facsimileText || merged.facsimileText || '',
          reasonsForRejection: (editData?.reasonsForRejection && editData.reasonsForRejection !== 'Not Applicable') ? editData.reasonsForRejection : (icBackend?.reasonsForRejection || 'Not Applicable'),
          inspectingEngineer: editData?.inspectingEngineer || icBackend?.inspectingEngineer || currentUser?.userName || 'Inspecting Engineer',
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

  /* Build Section 1 key-value pairs */
  const icFields = icData
    ? Object.entries(SLEEPER_FIELD_MAP)
        .filter(([key]) => {
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
        {notif.msg && (
          <Notification
            message={notif.msg}
            type={notif.type}
            autoClose={true}
            autoCloseDelay={4000}
            onClose={() => setNotif({ msg: '', type: '' })}
          />
        )}

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
                      <td style={{ ...S.tdVal, whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{formatCorrectionText(value)}</td>
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
