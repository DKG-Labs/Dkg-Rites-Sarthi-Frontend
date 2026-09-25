import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  generateRawMaterialCertificate,
  generateProcessMaterialCertificate,
  generateFinalProductCertificate,
  getRmIcEditData,
  getProcessIcEditData,
  getFinalIcEditData,
  getFinalIcSaveChanges,
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

/* ─── helpers ─── */
const getProductType = (row) => {
  const pt = (row.product_type || row.productType || '').toLowerCase();
  if (pt.includes('raw') || pt.includes('rm')) return 'RM';
  if (pt.includes('final') || pt.includes('fp') || pt.includes('final product')) return 'FINAL';
  return 'PROCESS';
};

const numberToWords = (num) => {
  if (num === 0) return "Zero";
  const a = ["", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  if ((num = num.toString()).length > 9) return "Overflow";
  let n = ("000000000" + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return "";
  let str = "";
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + (Number(n[1][1]) ? "-" + a[n[1][1]] : " ")) + "Crore " : "";
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + (Number(n[2][1]) ? "-" + a[n[2][1]] : " ")) + "Lakh " : "";
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + (Number(n[3][1]) ? "-" + a[n[3][1]] : " ")) + "Thousand " : "";
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + (Number(n[4][1]) ? "-" + a[n[4][1]] : " ")) + "Hundred " : "";
  str += (Number(n[5]) !== 0) ? ((str !== "") ? "and " : "") + (a[Number(n[5])] || b[n[5][0]] + (Number(n[5][1]) ? "-" + a[n[5][1]] : " ")) : "";
  return str.trim();
};

const digitWords = {
  '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three', '4': 'Four',
  '5': 'Five', '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine'
};

const decimalNumberToWords = (num) => {
  const str = typeof num === 'number' ? num.toFixed(3) : String(num);
  const parts = str.split('.');
  const intPart = parseInt(parts[0], 10) || 0;
  const intWords = numberToWords(intPart).trim();
  
  if (parts.length > 1 && parts[1]) {
    let decStr = parts[1].slice(0, 3);
    const decWords = decStr.split('').map(d => digitWords[d] || d).join(' ');
    return `${intWords} Point ${decWords}`;
  }
  return intWords;
};

const getErcKFactor = (callOrType) => {
  if (callOrType && typeof callOrType === "object" && callOrType.ercType) {
    const explicitType = String(callOrType.ercType).toLowerCase().trim();
    if (explicitType.includes("mk-iii") || explicitType.includes("mk iii") || explicitType.includes("3701")) return 0.91;
    if (explicitType.includes("j-type") || explicitType.includes("j type") || explicitType.includes("erc-j") || explicitType.includes("4158")) return 0.915;
    if (explicitType.includes("mk-v") || explicitType.includes("mk v") || explicitType.includes("5919")) return 1.088;
  }

  let searchStr = "";
  if (typeof callOrType === "string") {
    searchStr = callOrType;
  } else if (callOrType && typeof callOrType === "object") {
    searchStr = [
      callOrType.ercType,
      callOrType.productType,
      callOrType.product_type,
      callOrType.typeOfErc,
      callOrType.drgNo,
      callOrType.drawingNo,
      callOrType.drg_no,
      callOrType.description,
      callOrType.productDescription,
      callOrType.product_description,
      callOrType.remarks,
      callOrType.specNo,
      callOrType.specificationNo,
      callOrType.spec_no
    ].filter(Boolean).join(" ");
  }

  const lower = searchStr.toLowerCase();

  if (
    lower.includes("mk-iii") ||
    lower.includes("mk iii") ||
    lower.includes("mark iii") ||
    lower.includes("mark 3") ||
    lower.includes("mk 3") ||
    lower.includes("mkiii") ||
    lower.includes("3701") ||
    lower.includes("rt-3701") ||
    lower.includes("t-3701")
  ) {
    return 0.91;
  }

  if (
    lower.includes("j-type") ||
    lower.includes("j type") ||
    lower.includes("j_type") ||
    lower.includes("erc-j") ||
    lower.includes("erc j") ||
    lower.includes("j-clip") ||
    lower.includes("j clip") ||
    lower.includes("4158") ||
    lower.includes("rt-4158") ||
    lower.includes("8258") ||
    lower.includes("t-8258")
  ) {
    return 0.915;
  }

  if (
    lower.includes("mk-v") ||
    lower.includes("mk v") ||
    lower.includes("mark v") ||
    lower.includes("mark 5") ||
    lower.includes("mk 5") ||
    lower.includes("mkv") ||
    lower.includes("5919") ||
    lower.includes("rt-5919") ||
    lower.includes("t-5919") ||
    lower.includes("t5919") ||
    lower.includes("6025")
  ) {
    return 1.088;
  }

  return 1.088;
};

const generateQuantityRemarks = (c) => {
  if (!c) return "";
  const rawErcType = c.ercType || c.productType || c.description || c.drgNo || "";
  const kFactor = getErcKFactor(c || rawErcType);

  const qtyNowOffered = Number(c.qtyNowOffered || 0);
  const qtyNowRejected = Number(c.qtyNowRejected || 0);
  
  let ercUsedCount = 0;
  if (c.ercUsedForTesting !== undefined && c.ercUsedForTesting !== null) {
    ercUsedCount = Number(c.ercUsedForTesting);
  } else if (c.erc_used_for_testing !== undefined && c.erc_used_for_testing !== null) {
    ercUsedCount = Number(c.erc_used_for_testing);
  } else if (c.lotDetails && Array.isArray(c.lotDetails) && c.lotDetails.length > 0) {
    ercUsedCount = c.lotDetails.reduce((sum, l) => sum + (Number(l.ercUsedForTesting || l.erc_used_for_testing || l.ercUsed || l.erc_used || l.noOfErcUsed || l.no_of_erc_used || l.testingQty) || 0), 0);
  } else if (c.finalLotDetails && Array.isArray(c.finalLotDetails) && c.finalLotDetails.length > 0) {
    ercUsedCount = c.finalLotDetails.reduce((sum, l) => sum + (Number(l.ercUsedForTesting || l.erc_used_for_testing || l.ercUsed || l.erc_used || l.noOfErcUsed || l.no_of_erc_used || l.testingQty) || 0), 0);
  }
  
  let qtyNowAccepted = 0;
  if (c.qtyNowPassed !== undefined && c.qtyNowPassed !== null && c.qtyNowPassed !== "") {
    qtyNowAccepted = Number(String(c.qtyNowPassed).replace(/\*/g, '')) || 0;
  } else if (qtyNowOffered > 0) {
    qtyNowAccepted = Math.max(0, qtyNowOffered - qtyNowRejected - ercUsedCount);
  }
  
  const isMtUom = (() => {
    const directUom = String(
      c?.uom || 
      c?.unit || 
      c?.poUom || 
      c?.itemUom || 
      c?.poQtyUnit || 
      c?.uomCd ||
      c?.uom_cd ||
      c?.poItem?.uom || 
      c?.poItem?.uomCd ||
      c?.poItems?.[0]?.uom || 
      ""
    ).trim().toUpperCase();

    if (
      directUom === "15" ||
      directUom.startsWith("MT") ||
      directUom.startsWith("M.T") ||
      directUom.includes("METRIC") ||
      directUom.includes("TON")
    ) {
      return true;
    }

    if (
      directUom.startsWith("NO") ||
      directUom.includes("NUMBER") ||
      directUom.includes("SET") ||
      directUom.includes("PIECE") ||
      directUom.includes("EACH") ||
      directUom === "01"
    ) {
      return false;
    }

    const descStr = String(c?.description || "");
    const poMatch = descStr.match(/PO\s+Sr\.?\s*No\.?\s*[^)]*?\b(?:For|Qty|:|-)\s*[\d,.]+\s*([A-Za-z.]+)/i);
    if (poMatch && poMatch[1]) {
      const u = poMatch[1].trim().toUpperCase();
      if (u === "15" || u.startsWith("MT") || u.startsWith("M.T") || u.includes("METRIC") || u.includes("TON")) return true;
      if (u.startsWith("NO") || u.includes("NUM") || u.includes("SET")) return false;
    }

    const allText = `${c?.description || ""} ${c?.contractRef || ""} ${c?.poDetails || ""}`;
    if (/\b(?:MTS?\.?|M\.T\.|METRIC\s+TONNES?|METRIC\s+TONS?|TONNES?|TONS?)\b/i.test(allText) && !/\b(?:NOS?\.?|NUMBERS?)\b/i.test(allText)) return true;
    return false;
  })();

  const acceptedMt = (Math.round(((qtyNowAccepted * kFactor) / 1000) * 1000 + Number.EPSILON) / 1000);
  const acceptedMtWords = decimalNumberToWords(acceptedMt);
  const acceptedNosFormatted = Number(qtyNowAccepted).toLocaleString('en-IN');
  const acceptedNosWords = numberToWords(qtyNowAccepted);

  let text = isMtUom
    ? `Quantity now passed ${acceptedMtWords} Mt Only Total Quantity is ${acceptedNosFormatted} Nos, `
    : `Quantity now passed ${acceptedNosWords} (${acceptedNosFormatted}) Nos. Only, `;
  
  if (qtyNowAccepted > 0) {
    let bagsOf50 = Math.floor(qtyNowAccepted / 50);
    let rem = qtyNowAccepted % 50;
    let packText = [];
    if (bagsOf50 > 0) packText.push(`${bagsOf50} Bags X 50 Nos per bag`);
    if (rem > 0) packText.push(`01 Bag X ${rem.toString().padStart(2, '0')} Nos`);
    if (packText.length > 0) {
      text += `Packed in ${packText.join(', ')}. `;
    }
  }

  if (c.lotDetails && c.lotDetails.length > 0) {
    let markings = c.lotDetails.map(l => `${l.lotNo || ''}, HNO - ${l.heatNo || ''}`).filter(Boolean).join(' & ');
    if (markings) {
      text += `Marking: ${markings} `;
    }
  }
  
  if (ercUsedCount > 0) {
    text += `Note: ${ercUsedCount} Nos. ERC consumed in Destructive Testing are extra offer `;
  }

  let stageIcText = "";
  if (c.rmIcNo) {
    let rmDateStr = c.rmIcDate ? ` Dt: ${c.rmIcDate}` : "";
    let bookSetStr = (c.bookNo && c.setNo) ? ` Book No.${c.bookNo} Set No. ${c.setNo}` : "";
    stageIcText += `Note: Raw Material Pre-Inspected by RITES vide Stage I.C. No. ${c.rmIcNo}${rmDateStr}${bookSetStr}`;
  }
  
  if (c.processIcNo) {
    let processDateStr = c.processIcDate ? ` Dt: ${c.processIcDate}` : "";
    stageIcText += `${stageIcText ? ", " : ""}Note: Process Inspection carried out by RITES vide Stage I.C. No. ${c.processIcNo}${processDateStr}`;
  } else {
    stageIcText += `${stageIcText ? ", " : ""}Note: Process Inspection carried out by RITES as per the Railway Board Letter No. 2024/RS(G)/779/12`;
  }

  if (stageIcText) {
    text += `${stageIcText} `;
  }

  if (c.ibsCaseNo && c.ibsCaseNo !== '-') {
    text += `(IBS Case No: ${c.ibsCaseNo})\n`;
  } else {
    text += `\n`;
  }

  if (qtyNowRejected > 0 && qtyNowAccepted === 0) {
    text += `\nMaterial is Non-conforming as per Lab Report No. [FILL_LAB_REPORT]. In the chemical test, the observed value was [OBSERVED], which exceeds the specified limit.\n`;
  } else {
    text += `NOTE: THE SAMPLES REJECTED DURING INSPECTION HAVE SUBSEQUENTLY BEEN USED FOR DESTRUCTIVE TESTING.`;
  }
  
  return text;
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
  remarks:              'Remark',
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
  remarks:              'Remark',
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
  remarks:                'Remark',
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
  'processIcNo',
  'quantityNowPassedText'
];

/* ─── main component ─── */
const CorrectionSlipModal = ({ row, onClose, viewOnly = false, isViewOnly = false }) => {
  const isViewMode = viewOnly || isViewOnly || row?.isClosed || row?.status === 'Closed' || row?.activeTab === 'closed';
  const [icData, setIcData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [icError, setIcError] = useState('');
  const [corrections, setCorrections] = useState([emptyRow()]);

  const [issuing, setIssuing] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: 'info' });
  const [showPDF, setShowPDF] = useState(false);
  const [storedDoc, setStoredDoc] = useState(null);
  const [hasExistingSlip, setHasExistingSlip] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const callNo = row?.call_no || row?.callNo || row?.callNumber || row?.requestId || '';
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
            editData = await getFinalIcSaveChanges(fullIcNumber);
            if (!editData) {
              editData = await getFinalIcEditData(fullIcNumber);
            }
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

        if (productType === 'FINAL') {
          const fullRemarks = (merged.quantityNowPassedText && String(merged.quantityNowPassedText).trim().length > 10)
            ? merged.quantityNowPassedText
            : generateQuantityRemarks(merged);
          merged.remarks = fullRemarks || merged.remarks || 'LOT FOUND ACCEPTABLE AND CLEARED FOR DELIVERY';
          merged.quantityNowPassedText = merged.remarks;
        }

        setIcData(merged);
      } catch (err) {
        setIcError('Could not load IC data: ' + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    if (icNumber) load();
  }, [icNumber, productType]);

  /* restore saved corrections and check stored document */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callNo, isViewMode]);

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
      if (!row.insteadOf.trim()) {
        showNotif(`Row ${i + 1}: "Instead Of" value cannot be empty.`, 'error');
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

  /* ── delete existing correction slip ── */
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
        <Notification
          message={notification.message}
          type={notification.type}
          autoClose={true}
          autoCloseDelay={4000}
          onClose={() => setNotification({ message: '', type: 'info' })}
        />

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
                              rows={corr.readAs && (corr.readAs.includes('\n') || corr.readAs.length > 80) ? Math.min(Math.max(corr.readAs.split('\n').length + (corr.readAs.length > 150 ? 2 : 0), 3), 8) : 2}
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
                              rows={corr.insteadOf && (corr.insteadOf.includes('\n') || corr.insteadOf.length > 80) ? Math.min(Math.max(corr.insteadOf.split('\n').length + (corr.insteadOf.length > 150 ? 2 : 0), 3), 8) : 2}
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
