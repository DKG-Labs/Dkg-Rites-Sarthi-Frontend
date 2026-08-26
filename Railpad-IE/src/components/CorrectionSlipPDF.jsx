import React, { useRef, useState, useEffect } from 'react';

import { generatePdfBase64 } from '../utils/exportUtils';
import { saveCorrectionSlip } from '../services/correctionSlipService';

/* ─── print / screen styles ─── */
const styles = `
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; background: #fff; }

  @page {
    size: A4 portrait;
    margin: 10mm 14mm 10mm 14mm;
  }

  .cs-wrap {
    font-family: 'Times New Roman', Times, serif;
    font-size: 10.5pt;
    color: #000;
    background: #fff;
    line-height: 1.35;
  }

  /* A4 sheet */
  .cs-a4 {
    width: 210mm;
    min-height: 277mm;
    padding: 10mm 15mm 10mm 15mm;
    background: #fff;
    margin: 0 auto;
    box-sizing: border-box;
  }
  .cs-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  .cs-issue-box {
    border: 1px solid #000;
    padding: 5px 9px;
    font-size: 9.5pt;
    font-weight: bold;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .cs-logo-area { text-align: right; }
  .cs-logo-area img { height: 56px; object-fit: contain; }

  /* ── Title ── */
  .cs-title {
    text-align: center;
    font-size: 13pt;
    font-weight: bold;
    margin: 14px 0 6px;
    letter-spacing: 0.5px;
  }
  .cs-date {
    text-align: right;
    font-size: 10pt;
    margin: 6px 0 16px;
  }

  /* ── Section headings ── */
  .cs-sh {
    font-size: 11.5pt;
    font-weight: bold;
    margin: 14px 0 8px;
  }
  .cs-sh-text {
    display: inline-block;
    font-weight: bold;
  }

  /* ── Cert row ── */
  .cs-cert-row {
    display: flex;
    align-items: baseline;
    width: 100%;
    font-size: 11pt;
    margin-bottom: 6px;
  }

  /* ── Book No / Set No row with fill lines ── */
  .cs-bk-row {
    display: flex;
    align-items: center;
    font-size: 10pt;
    margin-bottom: 16px;
  }
  .cs-bk-label {
    white-space: nowrap;
    padding-right: 6px;
  }
  .cs-bk-fill {
    flex: 1;
    border-bottom: 1px solid #000;
    text-align: center;
    font-weight: bold;
    padding-bottom: 2px;
    margin: 0 10px;
    min-height: 18px;
  }

  /* ── Section 2 ── */
  .cs-sec2-heading {
    font-size: 11.5pt;
    font-weight: bold;
    margin: 12px 0 6px;
    line-height: 1.4;
  }
  .cs-sec2-label {
    display: inline-block;
    font-weight: bold;
  }
  .cs-po-desc {
    font-style: italic;
    font-weight: bold;
    font-size: 10pt;
  }
  .cs-contractor {
    font-size: 10.5pt;
    margin-bottom: 4px;
    line-height: 1.35;
  }
  .cs-contractor strong {
    font-weight: bold;
  }
  .cs-loa {
    font-size: 10pt;
    margin-bottom: 8px;
    line-height: 1.35;
  }

  /* ── Tables ── */
  .cs-table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 18px;
    font-size: 9.5pt;
  }
  .cs-table th {
    border: 1px solid #000;
    padding: 5px 7px;
    text-align: center;
    font-weight: bold;
    letter-spacing: 0.3px;
    background: #fff;
  }
  .cs-table td {
    border: 1px solid #000;
    padding: 5px 7px;
    text-align: center;
    vertical-align: middle;
  }
  .cs-table td.left { text-align: left; }

  /* ── Footer ── */
  .cs-footer-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-top: 20px;
    font-size: 10pt;
  }
  .cs-nc { font-weight: bold; }
  .cs-nc strong { font-weight: bold; }
  .cs-ie-title {
    font-weight: bold;
    font-size: 10pt;
    text-align: right;
    letter-spacing: 0.5px;
  }

  .cs-footer-bottom {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-top: 6px;
    font-size: 9.5pt;
  }

  /* Stamp row: label + box side by side */
  .cs-stamp-row {
    display: flex;
    align-items: center;
    gap: 40px;
    margin-bottom: 6px;
  }
  .cs-stamp-label { font-weight: bold; font-size: 9.5pt; white-space: nowrap; }
  .cs-stamp-box {
    border: 1px solid #555;
    width: 120px;
    height: 52px;
    flex-shrink: 0;
  }
  .cs-copies { font-weight: bold; font-size: 10.5pt; margin: 4px 0 2px; }

  /* Sign block */
  .cs-sign-block { text-align: right; }
  .cs-sign-line {
    border-top: 1px solid #000;
    width: 200px;
    margin-left: auto;
    margin-top: 10px;
  }
  .cs-ie-name {
    text-align: right;
    font-size: 9.5pt;
    margin-top: 3px;
    font-weight: bold;
  }

  /* Contact block – left aligned under stamp area */
  .cs-contact-block {
    margin-top: 4px;
    font-size: 9pt;
    line-height: 1.3;
  }

  /* Registered office – bottom, centered, with top rule */
  .cs-reg-office {
    margin-top: 12px;
    border-top: 1px solid #888;
    padding-top: 6px;
    font-size: 9.5pt;
    text-align: center;
    line-height: 1.3;
  }

  /* ── Screen preview ── */
  .cs-preview {
    padding: 24px;
    background: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .cs-shadow { box-shadow: 0 4px 24px rgba(0,0,0,0.14); }

  @media print {
    .cs-toolbar, button { display: none !important; }
    .cs-preview { padding: 0 !important; margin: 0 !important; background: #fff !important; display: block !important; }
    .cs-shadow { box-shadow: none !important; }
    .cs-a4 { width: 100% !important; padding: 0 !important; margin: 0 !important; min-height: auto !important; }
  }
`;

const toWords = (n) => {
  const w = ['','ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE','TEN'];
  return (n >= 1 && n <= 10) ? w[n] : String(n);
};

const today = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

const downloadBase64Pdf = (base64Data, filename) => {
  try {
    const cleanBase64 = String(base64Data).replace(/^data:application\/pdf;base64,/, '').replace(/\s/g, '');
    const byteCharacters = atob(cleanBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.warn('downloadBase64Pdf failed:', e);
  }
};

const CorrectionSlipPDF = ({ icData = {}, corrections = [], callNo = '', icFields = [], createdBy = 'unknown', onBack, onClose }) => {
  const printRef = useRef();
  const [isESigning, setIsESigning]   = useState(false);
  const [notif, setNotif]             = useState({ msg: '', type: '' });

  // Listen for Capricorn PKI bridge result
  useEffect(() => {
    const handlePkiStatus = async (event) => {
      const { status, message, signedData } = event.detail;
      const displayMsg = (message || '').replace(/certificate/gi, 'Correction Slip');
      setNotif({ msg: displayMsg, type: status });

      if (status === 'success' && signedData) {
        try {
          setNotif({ msg: 'Saving correction slip data...', type: 'info' });
          await saveCorrectionSlip(callNo, corrections, createdBy);

          // Auto-download signed PDF
          const fileName = `Correction_Slip_${callNo || 'Report'}.pdf`;
          downloadBase64Pdf(signedData, fileName);

          setNotif({ msg: 'Correction slip e-signed, saved & downloaded successfully!', type: 'success' });
        } catch (err) {
          console.error('Save/Download error after eSign:', err);
          setNotif({ msg: 'Signed but failed to save/download: ' + err.message, type: 'error' });
        }
      }
      setIsESigning(false);
    };
    window.addEventListener('pki-status', handlePkiStatus);
    return () => window.removeEventListener('pki-status', handlePkiStatus);
  }, [callNo, corrections, createdBy]);

  const keyToLabel = {};
  icFields.forEach(f => { keyToLabel[f.key] = f.label; });

  const getColLabel = (key) => keyToLabel[key] || key;

  const handleESign = async () => {
    const element = printRef.current;
    if (!element) return;

    try {
      setIsESigning(true);
      setNotif({ msg: 'Generating PDF snapshot for signing...', type: 'info' });

      const base64Pdf = await generatePdfBase64(element);
      if (!base64Pdf || !base64Pdf.startsWith('JVBER')) {
        throw new Error('Failed to generate PDF snapshot from UI.');
      }

      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const timestamp = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}+05:30`;
      const txn = Math.random().toString(16).slice(2, 10).toUpperCase();
      const fileName = `Correction_Slip_${callNo || 'Report'}.pdf`;

      const xmlRequest = `
        <request>
          <command>pkiNetworkSign</command>
          <ts>${timestamp}</ts>
          <txn>${txn}</txn>
          <certificate>
            <attribute name='CN'></attribute>
            <attribute name='O'></attribute>
            <attribute name='OU'></attribute>
            <attribute name='T'></attribute>
            <attribute name='E'></attribute>
            <attribute name='SN'></attribute>
            <attribute name='CA'></attribute>
            <attribute name='TC'>SG</attribute>
            <attribute name='AP'>1</attribute>
          </certificate>
          <file>
            <attribute name='type'>pdf</attribute>
          </file>
          <pdf>
            <page>1</page>
            <cood>375,190</cood>
            <size>150,45</size>
          </pdf>
          <data>${base64Pdf}</data>
        </request>
      `.replace(/>\s+</g, '><').trim();

      if (typeof window.abc === 'function') {
        setNotif({ msg: 'Please complete the digital signature in the Capricorn bridge...', type: 'info' });
        window.abc(xmlRequest, callNo || 'CorrectionSlip', fileName);
      } else {
        throw new Error('Digital signature bridge (abc.js) not found. Please ensure the Capricorn client is running.');
      }
    } catch (error) {
      console.error('eSign Error:', error);
      setNotif({ msg: error.message || 'Failed to initiate signing.', type: 'error' });
      setIsESigning(false);
    }
  };

  const handleDirectDownload = async () => {
    const element = printRef.current;
    if (!element) return;

    try {
      setIsESigning(true);
      setNotif({ msg: 'Saving correction slip and generating PDF...', type: 'info' });

      try {
        await saveCorrectionSlip(callNo, corrections, createdBy);
      } catch (err) {
        console.warn('Correction slip save warning:', err);
      }

      const fileName = `Correction_Slip_${callNo || 'Report'}.pdf`;
      await generatePdfBase64(element, fileName);

      setNotif({ msg: 'Correction slip saved & PDF downloaded successfully!', type: 'success' });
    } catch (error) {
      console.error('Download IC Error:', error);
      setNotif({ msg: error.message || 'Failed to download PDF.', type: 'error' });
    } finally {
      setIsESigning(false);
    }
  };

  /* ── IC data ── */
  const certNo = icData?.certificateNo || callNo || '—';

  const formatIcDate = (raw) => {
    if (!raw) return null;
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return raw;
      return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    } catch { return raw; }
  };
  const certDate    = formatIcDate(icData?.icEditDate) || icData?.certificateDate || '—';
  const installment = icData?.passedInstNo     || icData?.offeredInstNo || '—';
  const bookNo      = icData?.bookNo || '—';
  const setNo       = icData?.setNo  || '—';
  const description = icData?.description || icData?.descriptionOfStores || icData?.itemDescription || '';
  const contractor  = icData?.contractor  || icData?.contractorName || icData?.vendorName || '—';
  const loaNo       = icData?.contractRef || icData?.contractReferences || icData?.poNo || icData?.maNumberAndDate || '—';
  const purchaser   = icData?.purchasingAuthority || '—';
  const consignee   = icData?.consigneeRailway || icData?.consigneeManufacturer || icData?.consignee || '—';
  const billOfficer = icData?.billPayingOfficer || '—';
  const inspEngineer= icData?.inspectingEngineer || '';

  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, zIndex:9999, overflowY:'auto', background:'#fff' }}>
      <style>{styles}</style>

      {/* ── Preview area ── */}
      <div className="cs-preview">

        {/* Buttons above PDF - full width */}
        <div className="cs-toolbar" style={{ display:'flex', justifyContent:'space-between', alignItems: 'center', width:'100%', maxWidth:'210mm', marginBottom:'14px' }}>
          <button onClick={onBack} disabled={isESigning} style={{ padding:'8px 18px', background:'#fff', color:'#374151', border:'1px solid #d1d5db', borderRadius:'6px', fontSize:'14px', fontWeight:500, cursor: isESigning ? 'not-allowed' : 'pointer', opacity: isESigning ? 0.6 : 1 }}>← Back to Edit</button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleDirectDownload}
              disabled={isESigning}
              style={{
                padding: '8px 18px',
                background: '#f8fafc',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isESigning ? 'not-allowed' : 'pointer',
              }}
            >
              📥 Download PDF
            </button>
            <button
              onClick={handleESign}
              disabled={isESigning}
              style={{
                padding: '8px 22px',
                background: isESigning ? '#6b7280' : '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isESigning ? 'not-allowed' : 'pointer',
                minWidth: '120px',
                boxShadow: '0 2px 4px rgba(37,99,235,0.3)'
              }}
            >
              {isESigning ? '⏳ Signing...' : '✒ E Sign'}
            </button>
          </div>
        </div>

        {/* Notification banner */}
        {notif.msg && (
          <div style={{
              position:'fixed', top:'80px', right:'20px', zIndex:10000,
              maxWidth:'320px', padding:'10px 14px',
              borderRadius:'8px', fontSize:'12.5px', fontWeight:500,
              boxShadow:'0 4px 12px rgba(0,0,0,0.15)',
              background: notif.type === 'success' ? '#f0fdf4' : notif.type === 'error' ? '#fff1f2' : '#eff6ff',
              color: notif.type === 'success' ? '#15803d' : notif.type === 'error' ? '#be123c' : '#1d4ed8',
              borderLeft: `3px solid ${notif.type === 'success' ? '#22c55e' : notif.type === 'error' ? '#f43f5e' : '#3b82f6'}`,
              display:'flex', alignItems:'center', gap:'10px',
              animation:'slideIn 0.2s ease'
            }}>
            <span style={{ flex:1, lineHeight:'1.4' }}>{notif.msg}</span>
            <button onClick={() => setNotif({ msg:'', type:'' })} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', color:'inherit', padding:0, lineHeight:1, opacity:0.7 }}>✕</button>
          </div>
        )}

        <div ref={printRef}>
          <div className="cs-a4 cs-shadow cs-wrap">

            {/* ── Header row ── */}
            <div className="cs-header">
              <div className="cs-issue-box">F / 7.5 / 1 / 9 &nbsp; ISSUE NO. 01</div>
              <div className="cs-logo-area">
                <img src="/sarthi-logo1.png" alt="RITES Logo" />
              </div>
            </div>

            {/* ── Title ── */}
            <div className="cs-title">CORRECTION TO INSPECTION CERTIFICATE</div>
            <div className="cs-date">Date : - {today()}</div>

            {/* ── Section 1 ── */}
            <div className="cs-sh">1.&nbsp;&nbsp; <span className="cs-sh-text">Particulars of RITES Inspection Certificate</span></div>

            {/* ── Cert / Date / Installment row ── */}
            <div className="cs-cert-row">
              <div style={{ display: 'flex', alignItems: 'baseline', minWidth: '52%' }}>
                <span style={{ whiteSpace: 'nowrap', fontSize: '11pt' }}>Certificate No.</span>
                <span style={{ fontWeight: 'bold', paddingLeft: '6px', whiteSpace: 'nowrap', fontSize: '11pt' }}>{certNo}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', minWidth: '28%' }}>
                <span style={{ whiteSpace: 'nowrap', fontSize: '11pt' }}>Date</span>
                <span style={{ fontWeight: 'bold', paddingLeft: '6px', whiteSpace: 'nowrap', fontSize: '11pt' }}>{certDate}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ whiteSpace: 'nowrap', fontSize: '11pt' }}>Installment</span>
                <span style={{ fontWeight: 'bold', paddingLeft: '6px', whiteSpace: 'nowrap', fontSize: '11pt' }}>{installment}</span>
              </div>
            </div>

            {/* Book No / Set No — fill line style */}
            <div className="cs-bk-row">
              <span className="cs-bk-label">Book No.</span>
              <span className="cs-bk-fill">{bookNo !== '—' ? bookNo : ''}</span>
              <span className="cs-bk-label">Set No.</span>
              <span className="cs-bk-fill">{setNo !== '—' ? setNo : ''}</span>
            </div>

            {/* ── Section 2 ── */}
            <div className="cs-sec2-heading">
              2.&nbsp;&nbsp; <span className="cs-sec2-label">Particulars of Purchase order:&nbsp;</span>
              <span className="cs-po-desc">{description.toUpperCase()}</span>
            </div>

            <div className="cs-contractor">
              <strong>Contractor</strong>&nbsp;&nbsp;{contractor}
            </div>
            <div className="cs-loa">
              LOA No.&nbsp;&nbsp;{loaNo}
            </div>

            <table className="cs-table">
              <thead>
                <tr>
                  <th style={{ fontWeight: 'bold' }}>PURCHASER</th>
                  <th style={{ fontWeight: 'bold' }}>CONSIGNEE</th>
                  <th style={{ fontWeight: 'bold' }}>BILL PAYING OFFICER</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{purchaser}</td>
                  <td>{consignee}</td>
                  <td>{billOfficer}</td>
                </tr>
              </tbody>
            </table>

            {/* ── Section 3 ── */}
            <div className="cs-sh">3.&nbsp;&nbsp; <span className="cs-sh-text">Correction to be made</span></div>

            <table className="cs-table">
              <thead>
                <tr>
                  <th style={{ width:'18%', fontWeight: 'bold' }}>COLUMN</th>
                  <th style={{ width:'22%', fontWeight: 'bold' }}>READ AS</th>
                  <th style={{ fontWeight: 'bold' }}>INSTEAD OF</th>
                </tr>
              </thead>
              <tbody>
                {corrections.map((c, idx) => (
                  <tr key={idx}>
                    <td className="left">{getColLabel(c.columnName)}</td>
                    <td>{c.readAs}</td>
                    <td className="left">{c.insteadOf}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── Footer top row: No. of Corrections | INSPECTING ENGINEER ── */}
            <div className="cs-footer-top">
              <div className="cs-nc">
                No. of Corrections &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>{toWords(corrections.length)}</strong>
              </div>
              <div className="cs-ie-title">INSPECTING ENGINEER</div>
            </div>

            {/* ── Footer body: stamp+copies left | signature right ── */}
            <div className="cs-footer-bottom">
              <div>
                <div className="cs-stamp-row">
                  <span className="cs-stamp-label">Facsimile of RITES Stamp</span>
                  <div className="cs-stamp-box"></div>
                </div>
                <div className="cs-copies">
                  Copies:
                </div>
                <div className="cs-contact-block">
                  Contractor (3 copies) / Purchaser / Consignee / Paying Authority.<br />
                  <span style={{ display: 'inline-block', paddingLeft: '145px', whiteSpace: 'nowrap' }}>Regional Office: Churchgate Station Building, 2<sup>nd</sup> Floor, Mumbai - 400020.</span><br />
                  Phone: 2201 2523, 22015573,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; E-mail: riteswe@bom3.vsnl.net.in&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Telegram: 'RITESRAIL'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Fax: 22084155
                </div>
              </div>

              <div className="cs-sign-block">
                {inspEngineer && <div className="cs-ie-name">{inspEngineer}</div>}
              </div>
            </div>

            {/* ── Registered Office ── */}
            <div className="cs-reg-office">
              Registered Office: Rites Bhawan, Plot No. 1, Sector – 29, Gurgaon
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default CorrectionSlipPDF;
