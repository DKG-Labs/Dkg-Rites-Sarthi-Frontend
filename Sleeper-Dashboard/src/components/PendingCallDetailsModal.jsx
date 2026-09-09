import React, { useState } from 'react';
import CallCancellationModal from './CallCancellationModal';
import { generateCallLetterPDF } from '../utils/generateCallLetterPDF';
import { API_BASE_URL, apiService } from '../services/api';

const PendingCallDetailsModal = ({
  isOpen,
  onClose,
  call,
  showNotification,
  availableActions = [],
  onSchedule,
  onReschedule,
  onStart,
  onResume,
  onEnterShiftDetails,
  onDone
}) => {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const notify = (msg, type = 'success') => {
    if (showNotification) {
      showNotification(msg, type);
    } else {
      alert(msg);
    }
  };

  if (!isOpen || !call) return null;

  const handleDownloadLetter = async () => {
    const callNumber = call.call_no || call.callNumber || call.requestId;
    if (!callNumber) {
      notify('Call ID not found. Cannot generate PDF.', 'error');
      return;
    }
    setPdfLoading(true);
    try {
      let enrichedCall = { ...call, callNumber };
      try {
        const res = await apiService.getCallLetterDetails(callNumber);
        const dataObj = res?.data || res;
        if (dataObj && (dataObj.responseData || dataObj.data)) {
          const details = dataObj.responseData || dataObj.data;
          enrichedCall = { ...enrichedCall, ...details };
        } else if (dataObj && typeof dataObj === 'object') {
          enrichedCall = { ...enrichedCall, ...dataObj };
        }
      } catch (fetchErr) {
        console.warn('Could not fetch online call letter details, generating from call cache:', fetchErr);
      }

      generateCallLetterPDF(enrichedCall);
      notify(`Call Letter PDF for ${callNumber} downloaded.`, 'success');
    } catch (err) {
      console.error('Failed to generate Call Letter PDF:', err);
      notify('Failed to generate Call Letter PDF.', 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  const downloadPoDoc = async () => {
    let rawPoNo = call.po_no || call.poNumber || call.poNo || call.rawPoNo || call.rlyPoSrNo;
    if (!rawPoNo) {
      notify('No PO number available for this call.', 'error');
      return;
    }

    let barePoNo = String(rawPoNo).trim();
    if (barePoNo.includes('/')) {
      const parts = barePoNo.split('/').map((p) => p.trim()).filter(Boolean);
      const numericPart = parts.find((p) => p.length >= 6 && !isNaN(Number(p.replace(/[^0-9]/g, ''))));
      if (numericPart) {
        barePoNo = numericPart;
      } else {
        barePoNo = parts[0];
      }
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/vendor/po-pdf-path?rawPoNo=${encodeURIComponent(barePoNo)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }
      const data = await response.json();
      const pdfPath = data?.responseData;
      if (!pdfPath) {
        notify(`No PO document found for PO ${barePoNo}.`, 'info');
        return;
      }

      if (pdfPath.startsWith('http') || pdfPath.includes('ireps.gov.in')) {
        const proxyUrl = `${API_BASE_URL}/vendor/proxy-pdf?url=${encodeURIComponent(pdfPath)}`;
        const a = document.createElement('a');
        a.href = proxyUrl;
        a.download = `PO_${barePoNo}.pdf`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        window.open(pdfPath, '_blank');
      }
      notify(`PO & MA document for ${barePoNo} downloaded.`, 'success');
    } catch (err) {
      console.error('Error downloading PO document:', err);
      notify('Failed to download PO document.', 'error');
    }
  };

  const isCancelled = (call.status || call.jobStatus || '').toUpperCase().includes('CANCEL');

  const formatFullPo = () => {
    const rly = call.scrCode || call.rlyCode || call.rlyShortName || '';
    const po = call.po_no || call.poNumber || call.poNo || '';
    const sr = call.poSr || call.po_sr || call.poSerialNo || '';
    let result = po;
    if (sr && !po.includes('/' + sr)) {
      result = `${po} / ${sr}`;
    }
    if (rly && !result.startsWith(rly)) {
      result = `${rly} / ${result}`;
    }
    return result || '-';
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose} 
      style={{ 
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)', 
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="pending-call-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: '1000px', 
          width: '92vw', 
          borderRadius: '16px', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div className="modal-header" style={{
          padding: '18px 24px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 className="modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#0ea5e9' }}>📋</span> Inspection Call Details - <span style={{ color: '#334155' }}>{call.call_no || call.callNumber || call.requestId}</span>
          </h2>
          <button 
            className="modal-close" 
            onClick={onClose}
            style={{
              background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%',
              width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s ease', color: '#64748b', fontSize: '1.2rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >×</button>
        </div>        <div className="modal-body" style={{ maxHeight: '85vh', overflowY: 'auto', padding: '28px 32px' }}>
          {/* Top Summary Section */}
          <div style={{ 
            background: 'linear-gradient(to right, #ffffff, #f8fafc)', 
            padding: '22px 26px', 
            borderRadius: '14px', 
            border: '1px solid #e2e8f0', 
            borderLeft: '5px solid #0ea5e9', 
            marginBottom: '28px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Call Number</label>
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>{call.call_no || call.callNumber || call.requestId || '-'}</div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px', display: 'block' }}>IBS Case Number</label>
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>{call.caseNo || call.ibsCaseNo || call.caseNumber || '-'}</div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px', display: 'block' }}>PO & PO Sr. No.</label>
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>{call.rlyPoSrNo || formatFullPo()}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Vendor Name</label>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{call.vendor_name || call.vendorName || call.vendorCode || '-'}</div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Sleeper Type</label>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#0369a1' }}>{call.sleeperType || call.product_type || call.productType || '-'}</div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Offered Quantity</label>
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>
                  {call.offeredQty ?? call.totalOffered ?? call.qty ?? '-'} {call.offeredQty || call.totalOffered ? (call.uom || 'Nos.') : ''}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Call Date</label>
                <div style={{ fontWeight: '600', fontSize: '13px', color: '#334155' }}>
                  {call.callDate ? new Date(call.callDate).toLocaleDateString('en-GB') : (call.createdDate ? new Date(call.createdDate).toLocaleDateString('en-GB') : '-')}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Desired Inspection Date</label>
                <div style={{ fontWeight: '600', fontSize: '13px', color: '#ea580c' }}>
                  {call.desiredInspectionDate ? new Date(call.desiredInspectionDate).toLocaleDateString('en-GB') : '-'}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Schedule Date</label>
                <div style={{ fontWeight: '600', fontSize: '13px', color: '#2563eb' }}>
                  {call.scheduleDate ? new Date(call.scheduleDate).toLocaleDateString('en-GB') : (call.scheduledDate ? new Date(call.scheduledDate).toLocaleDateString('en-GB') : '-')}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Status</label>
                <div style={{ display: 'inline-block', background: isCancelled ? '#fee2e2' : '#f1f5f9', color: isCancelled ? '#b91c1c' : '#475569', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: '700' }}>
                  {call.jobStatus || call.status ? (call.jobStatus || call.status).replace(/_/g, ' ') : '-'}
                </div>
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#f59e0b' }}>⚡</span> Actions & Documents
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', alignItems: 'stretch' }}>
            {/* Card 1: Reschedule / Schedule */}
            <button 
              onClick={() => {
                if (onReschedule) onReschedule();
                else if (onSchedule) onSchedule();
              }}
              style={{ 
                width: '100%', minHeight: '112px', borderRadius: '16px', fontWeight: '800',
                background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)', color: '#ffffff', border: 'none', cursor: 'pointer',
                fontSize: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.25)', transition: 'all 0.2s', padding: '16px'
              }}
            >
              <div style={{ width: '42px', height: '42px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <span>{call.scheduleDate || call.scheduledDate ? 'RESCHEDULE' : 'SCHEDULE / RESCHEDULE'}</span>
            </button>

            {/* Card 2: Resume / Start Inspection */}
            <button 
              onClick={() => {
                if (onResume) onResume();
                else if (onStart) onStart();
                else if (onEnterShiftDetails) onEnterShiftDetails();
              }}
              style={{ 
                width: '100%', minHeight: '112px', borderRadius: '16px', fontWeight: '800',
                background: 'linear-gradient(135deg, #047857 0%, #059669 100%)', color: '#ffffff', border: 'none', cursor: 'pointer',
                fontSize: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.25)', transition: 'all 0.2s', padding: '16px'
              }}
            >
              <div style={{ width: '42px', height: '42px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </div>
              <span>RESUME</span>
            </button>

            {/* Card 3: Cancel Call */}
            {!isCancelled ? (
              <button 
                onClick={() => setShowCancelModal(true)} 
                style={{ 
                  width: '100%', minHeight: '112px', borderRadius: '16px', fontWeight: '800', 
                  background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)', color: '#ffffff', border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  fontSize: '14px', boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.25)', transition: 'all 0.2s', padding: '16px'
                }}
              >
                <div style={{ width: '42px', height: '42px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                </div>
                <span>CANCEL CALL</span>
              </button>
            ) : (
              <div 
                style={{ 
                  width: '100%', minHeight: '112px', borderRadius: '16px', fontWeight: '800', 
                  background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  fontSize: '14px', padding: '16px'
                }}
              >
                <span style={{ fontSize: '24px' }}>🚫</span>
                <span>CALL CANCELLED</span>
              </div>
            )}

            {/* Card 4: Call Letter */}
            <button
              onClick={handleDownloadLetter}
              disabled={pdfLoading}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
                padding: '16px 14px', background: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
                border: '1px solid #a5f3fc', borderRadius: '16px',
                cursor: pdfLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease',
                color: '#0891b2', width: '100%', minHeight: '112px',
                boxShadow: '0 4px 6px -1px rgba(8, 145, 178, 0.1)'
              }}
            >
              <div style={{ width: '42px', height: '42px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </div>
              <span style={{ fontWeight: '800', fontSize: '14px' }}>{pdfLoading ? 'Generating...' : 'Call Letter'}</span>
            </button>

            {/* Card 5: PO & MA */}
            <button
              onClick={downloadPoDoc}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
                padding: '16px 14px', background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                border: '1px solid #d8b4fe', borderRadius: '16px',
                cursor: 'pointer', transition: 'all 0.2s ease',
                color: '#7e22ce', width: '100%', minHeight: '112px',
                boxShadow: '0 4px 6px -1px rgba(126, 34, 206, 0.1)'
              }}
            >
              <div style={{ width: '42px', height: '42px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7e22ce" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <span style={{ fontWeight: '800', fontSize: '14px' }}>PO & MA</span>
            </button>
          </div>
        </div>
      </div>

      <CallCancellationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        call={call}
        showNotification={showNotification}
        onSuccess={() => {
          if (onDone) onDone();
          if (onClose) onClose();
        }}
      />
    </div>
  );
};

export default PendingCallDetailsModal;
