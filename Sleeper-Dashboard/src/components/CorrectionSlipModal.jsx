import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import {
  getFinalIcEditData
} from '../services/certificateService';
import {
  fetchCorrectionSlip,
  fetchCorrectionSlipDocument,
  getViewCorrectionSlipPdfUrl,
  getDownloadCorrectionSlipPdfUrl,
  deleteCorrectionSlip
} from '../services/correctionSlipService';
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

/* ─── Styles ─── */
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

const CorrectionSlipModal = ({ row = {}, onClose, viewOnly = false, isViewOnly = false }) => {
  const isViewMode = viewOnly || isViewOnly || row?.isClosed || row?.status === 'Closed' || row?.activeTab === 'closed';
  const callNo = row?.requestId || row?.call_no || row?.callNo || row?.id || '';
  const [icData, setIcData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [icError, setIcError] = useState('');
  const [corrections, setCorrections] = useState([emptyRow()]);
  const [showPDF, setShowPDF] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [notif, setNotif] = useState({ msg: '', type: '' });
  const [storedDoc, setStoredDoc] = useState(null);
  const [hasExistingSlip, setHasExistingSlip] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
          row?.call_no,
          row?.callNo,
          row?.requestId,
        ])).filter(Boolean);

        let editData = null;
        for (const k of candidateKeys) {
          try {
            editData = await getFinalIcEditData(k);
            if (editData && (editData.certificateNo || editData.callNo || editData.id)) {
              break;
            }
          } catch {
            /* ignore & try next candidate key */
          }
        }

        const rawCertDate = editData?.certificateDate || icBackend?.certificateDate || row?.createdDate || row?.callDate;

        const normalizedData = {
          certificateNo: editData?.certificateNo || icBackend?.certificateNo || icBackend?.icNo || (callNo ? `IC/${callNo}` : '—'),
          certificateDate: formatDateVal(rawCertDate) || '—',
          bookNo: editData?.bookNo || icBackend?.bookNo || '—',
          setNo: editData?.setNo || icBackend?.setNo || '—',
          offeredInstNo: editData?.offeredInstNo || editData?.installmentNo || icBackend?.offeredInstNo || icBackend?.offeredInsttNo || '—',
          passedInstNo: editData?.passedInstNo || icBackend?.passedInstNo || icBackend?.passedInsttNo || '—',
          contractor: editData?.contractor || icBackend?.contractor || row?.vendorName || row?.vendor_name || '—',
          placeOfInspection: editData?.placeOfInspection || icBackend?.placeOfInspection || row?.placeOfInspection || row?.plantName || '—',
          contractRef: editData?.contractRef || icBackend?.contractRef || row?.poNo || row?.po_no || '—',
          maNumberAndDate: editData?.maNumberAndDate || icBackend?.maNumberAndDate || '—',
          billPayingOfficer: editData?.billPayingOfficer || icBackend?.billPayingOfficer || '—',
          consignee: editData?.consignee || icBackend?.consignee || row?.consignee || '—',
          purchasingAuthority: editData?.purchasingAuthority || icBackend?.purchasingAuthority || '—',
          vendorPoNo: editData?.vendorPoNo || icBackend?.vendorPoNo || '—',
          vendorPoDate: formatDateVal(editData?.vendorPoDate || icBackend?.vendorPoDate),
          unit: editData?.unit || icBackend?.unit || 'NOS',
          drawingNo: editData?.drawingNo || icBackend?.drawingNo || '—',
          qapNo: editData?.qapNo || icBackend?.qapNo || '—',
          descriptionOfStores: editData?.descriptionOfStores || editData?.description || icBackend?.descriptionOfStores || icBackend?.description || row?.itemName || '—',
          qtyOrdered: editData?.qtyOrdered ?? (icBackend?.qtyOrdered ?? row?.totalOrderQty ?? '—'),
          qtyOfferedPreviously: editData?.qtyOfferedPreviously ?? (icBackend?.qtyOfferedPreviously ?? row?.cummQtyOfferedPrev ?? '—'),
          qtyPassedPreviously: editData?.qtyPassedPreviously ?? (icBackend?.qtyPassedPreviously ?? row?.cummQtyPassedPrev ?? '—'),
          qtyNowOffered: editData?.qtyNowOffered ?? (icBackend?.qtyNowOffered ?? row?.offeredQty ?? '—'),
          qtyNowPassed: editData?.qtyNowPassed ?? (icBackend?.qtyNowPassed ?? row?.passedQty ?? '—'),
          qtyNowRejected: editData?.qtyNowRejected ?? (icBackend?.qtyNowRejected ?? row?.rejectedQty ?? 'NIL'),
          qtyStillDue: editData?.qtyStillDue ?? (icBackend?.qtyStillDue ?? '—'),
          quantityNowPassedText: editData?.quantityNowPassedText || icBackend?.quantityNowPassedText || '',
          remarks: editData?.remarks || icBackend?.remarks || '—',
          noOfItemsChecked: editData?.noOfItemsChecked || icBackend?.noOfItemsChecked || 'ONE',
          dateOfCall: formatDateVal(editData?.dateOfCall || icBackend?.dateOfCall || row?.createdDate),
          noOfVisits: editData?.noOfVisits || icBackend?.noOfVisits || '—',
          datesOfInspection: editData?.datesOfInspection || icBackend?.datesOfInspection || '—',
          trRecDate: formatDateVal(editData?.trRecDate || icBackend?.trRecDate),
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
      let docFound = null;
      try {
        const doc = await fetchCorrectionSlipDocument(callNo);
        if (doc && doc.exists) {
          docFound = doc;
          setStoredDoc(doc);
        } else {
          setStoredDoc(null);
        }
      } catch (e) {
        console.warn('Error checking stored correction slip document:', e);
      }

      const saved = await fetchCorrectionSlip(callNo);
      if (saved && saved.length > 0) {
        setHasExistingSlip(true);
        setCorrections(saved.map(s => ({
          id: Date.now() + Math.random(),
          columnName: s.columnName || s.column_name || '',
          readAs: formatCorrectionText(s.readAs || s.read_as || ''),
          insteadOf: formatCorrectionText(s.insteadOf || s.instead_of || ''),
        })));
      } else if (docFound) {
        setHasExistingSlip(true);
      } else {
        setHasExistingSlip(false);
        if (isViewMode) {
          setCorrections([]);
        } else {
          setCorrections([emptyRow()]);
        }
      }
    };
    if (callNo) restore();
  }, [callNo, isViewMode]);

  /* Build Section 1 key-value pairs */
  const icFields = icData
    ? Object.entries(SLEEPER_FIELD_MAP)
        .filter(([key]) => {
          const val = icData[key];
          return val !== undefined && val !== null && val !== '' && !Array.isArray(val);
        })
        .map(([key, label]) => ({ key, label, value: String(icData[key]) }))
    : [];

  const updateRow = (id, field, value) => {
    setCorrections(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === 'columnName') {
        const found = icFields.find(f => f.key === value);
        const val = found ? found.value : '';
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
      if (!row.insteadOf.trim()) {
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

  const handleDeleteCorrectionSlip = async () => {
    try {
      setDeleting(true);
      await deleteCorrectionSlip(callNo);
      setStoredDoc(null);
      setHasExistingSlip(false);
      setCorrections([emptyRow()]);
      setShowDeleteConfirm(false);
      showNotif('Correction slip deleted successfully. You can now issue a new one.', 'success');
    } catch (err) {
      console.error('Error deleting correction slip:', err);
      showNotif('Failed to delete correction slip: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setDeleting(false);
    }
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

  const isExistingOrView = hasExistingSlip || isViewMode;

  return (
    <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        {/* Header */}
        <div style={S.header}>
          <div>
            <div style={{ fontSize: '17px', fontWeight: '700', color: '#111827' }}>
              {hasExistingSlip ? 'Correction Slip Details' : (isViewMode ? 'View Correction Slip' : 'Issue Correction Slip')}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
              Call No: <span style={{ color: '#2563eb', fontWeight: 600 }}>{callNo}</span>
              {hasExistingSlip && (
                <span style={{ marginLeft: '10px', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                  Issued (1 Slip Limit)
                </span>
              )}
              {isViewMode && !hasExistingSlip && (
                <span style={{ marginLeft: '10px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                  Closed Call View
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {storedDoc && (
              <>
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
                  📄 View PDF
                </button>
                <button
                  type="button"
                  onClick={() => window.open(getDownloadCorrectionSlipPdfUrl(callNo), '_blank')}
                  style={{
                    padding: '6px 12px',
                    background: '#f0f9ff',
                    color: '#0369a1',
                    border: '1px solid #bae6fd',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Download stored correction slip PDF"
                >
                  ⬇️ Download
                </button>
              </>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '20px', cursor: 'pointer', lineHeight: 1, borderRadius: '6px', padding: '4px 8px' }}>✕</button>
          </div>
        </div>

        {/* Notification */}
        {notif.msg && (
          <div style={{ ...S.errorBox, background: notif.type === 'error' ? '#fee2e2' : (notif.type === 'success' ? '#ecfdf5' : '#fef3c7'), color: notif.type === 'error' ? '#991b1b' : (notif.type === 'success' ? '#047857' : '#92400e'), margin: '0 24px 12px' }}>
            {notif.msg}
          </div>
        )}

        {/* Body */}
        <div style={S.body}>
          {/* Top Banner if already issued and in Completed Calls */}
          {hasExistingSlip && !isViewMode && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px',
              padding: '14px 18px', marginBottom: '20px', display: 'flex',
              alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
            }}>
              <div>
                <div style={{ fontWeight: 700, color: '#92400e', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚠️</span> Correction Slip Already Issued
                </div>
                <div style={{ fontSize: '12.5px', color: '#78350f', marginTop: '2px' }}>
                  Only one correction slip can be added per call. You can view the stored PDF or delete this slip to create a new one.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {storedDoc && (
                  <button
                    type="button"
                    onClick={() => window.open(getViewCorrectionSlipPdfUrl(callNo), '_blank')}
                    style={{
                      padding: '7px 14px', background: '#0284c7', color: '#ffffff',
                      border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '12.5px',
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    📄 View PDF
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    padding: '7px 14px', background: '#fee2e2', color: '#dc2626',
                    border: '1px solid #fca5a5', borderRadius: '6px', fontWeight: '600', fontSize: '12.5px',
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  🗑️ Delete Slip
                </button>
              </div>
            </div>
          )}

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
            {isExistingOrView && corrections.length === 0 ? (
              <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b' }}>
                No correction slip details found for this call.
              </div>
            ) : (
              <>
                <table style={{ ...S.table, marginBottom: '12px' }}>
                  <thead>
                    <tr>
                      <th style={{ ...S.th, width: isExistingOrView ? '34%' : '30%' }}>Column Name</th>
                      <th style={{ ...S.th, width: isExistingOrView ? '33%' : '32%' }}>Read As</th>
                      <th style={{ ...S.th, width: isExistingOrView ? '33%' : '32%' }}>Instead Of</th>
                      {!isExistingOrView && <th style={{ ...S.th, width: '6%' }}>✕</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {corrections.map((corr) => (
                      <tr key={corr.id}>
                        <td style={{ ...S.td, padding: '6px 8px', verticalAlign: 'top' }}>
                          {isExistingOrView ? (
                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>
                              {icFields.find(f => f.key === corr.columnName)?.label || corr.columnName || '-'}
                            </div>
                          ) : (
                            <FieldDropdown
                              options={icFields}
                              hiddenKeys={HIDDEN_DROPDOWN_KEYS}
                              value={corr.columnName}
                              onChange={(val) => updateRow(corr.id, 'columnName', val)}
                              disabled={loading || !!icError}
                            />
                          )}
                        </td>
                        <td style={{ ...S.td, padding: '6px 8px', verticalAlign: 'top' }}>
                          {isExistingOrView ? (
                            <div style={{ padding: '6px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', whiteSpace: 'pre-wrap', color: '#0f172a' }}>
                              {corr.readAs || '-'}
                            </div>
                          ) : (
                            <textarea
                              rows={corr.readAs && corr.readAs.includes('\n') ? Math.min(Math.max(corr.readAs.split('\n').length, 2), 8) : 2}
                              style={S.inputBase}
                              placeholder="Enter corrected value"
                              value={corr.readAs}
                              onChange={(e) => updateRow(corr.id, 'readAs', e.target.value)}
                              onFocus={e => { e.target.style.borderColor = '#3b82f6'; }}
                              onBlur={e => { e.target.style.borderColor = '#d1d5db'; }}
                            />
                          )}
                        </td>
                        <td style={{ ...S.td, padding: '6px 8px', verticalAlign: 'top' }}>
                          {isExistingOrView ? (
                            <div style={{ padding: '6px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', whiteSpace: 'pre-wrap', color: '#0f172a' }}>
                              {corr.insteadOf || '-'}
                            </div>
                          ) : (
                            <textarea
                              rows={corr.insteadOf && corr.insteadOf.includes('\n') ? Math.min(Math.max(corr.insteadOf.split('\n').length, 2), 8) : 2}
                              style={S.inputBase}
                              placeholder="Enter instead of value"
                              value={corr.insteadOf}
                              onChange={(e) => updateRow(corr.id, 'insteadOf', e.target.value)}
                              onFocus={e => { e.target.style.borderColor = '#3b82f6'; }}
                              onBlur={e => { e.target.style.borderColor = '#d1d5db'; }}
                            />
                          )}
                        </td>
                        {!isExistingOrView && (
                          <td style={{ ...S.td, padding: '6px 8px', textAlign: 'center', verticalAlign: 'top' }}>
                            <button style={S.btnDanger} onClick={() => removeRow(corr.id)} title="Remove row">✕</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!isExistingOrView && (
                  <button style={S.addRowBtn} onClick={addRow}>+ Add Correction Row</button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={S.footer}>
          <button style={S.btnOutline} onClick={onClose}>
            {isExistingOrView ? 'Close' : 'Cancel'}
          </button>
          {isExistingOrView ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              {hasExistingSlip && !isViewMode && (
                <button
                  style={{ ...S.btnDanger, padding: '8px 16px', fontSize: '13px', background: '#dc2626', color: '#ffffff', borderRadius: '6px' }}
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : '🗑️ Delete Slip'}
                </button>
              )}
              {storedDoc && (
                <button
                  style={{ ...S.btnSuccess, background: '#059669' }}
                  onClick={() => window.open(getViewCorrectionSlipPdfUrl(callNo), '_blank')}
                >
                  📄 View Stored PDF
                </button>
              )}
            </div>
          ) : (
            <button
              style={{ ...S.btnSuccess, opacity: issuing ? 0.7 : 1 }}
              onClick={handleIssueCorrectionSlip}
              disabled={issuing || loading || !!icError}
            >
              {issuing ? 'Generating...' : 'Issue Correction Slip'}
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '440px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '17px', color: '#111827', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#dc2626' }}>🗑️</span> Delete Correction Slip?
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13.5px', color: '#4b5563', lineHeight: 1.5 }}>
              Are you sure you want to delete the Correction Slip for Call No. <strong>{callNo}</strong>?
              This will remove the saved corrections and the stored PDF document from Azure. You will then be able to issue a new correction slip.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                style={{
                  padding: '8px 14px', background: '#f3f4f6', color: '#374151',
                  border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px',
                  fontWeight: 600, cursor: 'pointer'
                }}
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                style={{
                  padding: '8px 16px', background: '#dc2626', color: '#ffffff',
                  border: 'none', borderRadius: '6px', fontSize: '13px',
                  fontWeight: 600, cursor: 'pointer'
                }}
                onClick={handleDeleteCorrectionSlip}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Slip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorrectionSlipModal;
