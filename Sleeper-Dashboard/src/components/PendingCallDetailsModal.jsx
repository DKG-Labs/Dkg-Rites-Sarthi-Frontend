import React, { useState } from 'react';
import CallCancellationModal from './CallCancellationModal';
import { generateCallLetterPDF } from '../utils/generateCallLetterPDF';
import { apiService } from '../services/api';

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
        const res = await apiService.getInspectionCallSummary(callNumber);
        if (res && (res.responseData || res.data)) {
          const details = res.responseData || res.data;
          enrichedCall = { ...enrichedCall, ...details };
        }
      } catch (fetchErr) {
        console.warn('Could not fetch online details, generating from call cache:', fetchErr);
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
    let rawPoNo = call.po_no || call.poNumber || call.poNo || call.rawPoNo;
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
      const response = await fetch(`/api/vendor/po-pdf-path?rawPoNo=${encodeURIComponent(barePoNo)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') && { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` })
        }
      });
      const data = await response.json();
      const pdfPath = data?.responseData;
      if (!pdfPath) {
        notify(`No PO document found for PO ${barePoNo}.`, 'info');
        return;
      }

      if (pdfPath.startsWith('http') || pdfPath.includes('ireps.gov.in')) {
        const proxyUrl = `/api/vendor/proxy-pdf?url=${encodeURIComponent(pdfPath)}`;
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
        </div>

        <div className="modal-body" style={{ maxHeight: '85vh', overflowY: 'auto', padding: '32px 32px' }}>
          {/* Top Summary Section */}
          <div style={{ 
            background: 'linear-gradient(to right, #ffffff, #f8fafc)', 
            padding: '24px 28px', 
            borderRadius: '14px', 
            border: '1px solid #e2e8f0', 
            borderLeft: '5px solid #0ea5e9', 
            marginBottom: '32px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Call Number</label>
                <div style={{ fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>{call.call_no || call.callNumber || call.requestId || '-'}</div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Vendor Name</label>
                <div style={{ fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>{call.vendor_name || call.vendorName || call.vendorCode || '-'}</div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '6px', display: 'block' }}>PO Number</label>
                <div style={{ fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>{formatFullPo()}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Product Type</label>
                <div style={{ display: 'inline-block', background: '#e0f2fe', color: '#0284c7', padding: '5px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>
                  {call.product_type || call.productType || 'Sleeper'}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Status</label>
                <div style={{ display: 'inline-block', background: isCancelled ? '#fee2e2' : '#f1f5f9', color: isCancelled ? '#b91c1c' : '#475569', padding: '5px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>
                  {call.jobStatus || call.status ? (call.jobStatus || call.status).replace(/_/g, ' ') : '-'}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Plant ID</label>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#334155' }}>{call.plantId || '-'}</div>
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#f59e0b' }}>⚡</span> Actions & Documents
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px', alignItems: 'stretch' }}>
            {availableActions.includes('schedule') && (
              <button 
                onClick={onSchedule} 
                style={{ 
                  width: '100%', minHeight: '112px', borderRadius: '16px', fontWeight: '800',
                  background: '#2563eb', color: '#ffffff', border: 'none', cursor: 'pointer',
                  fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.25)', transition: 'all 0.2s'
                }}
              >
                SCHEDULE
              </button>
            )}
            {availableActions.includes('reschedule') && (
              <button 
                onClick={onReschedule} 
                style={{ 
                  width: '100%', minHeight: '112px', borderRadius: '16px', fontWeight: '800',
                  background: '#2563eb', color: '#ffffff', border: 'none', cursor: 'pointer',
                  fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.25)', transition: 'all 0.2s'
                }}
              >
                RESCHEDULE
              </button>
            )}
            {availableActions.includes('start') && (
              <button 
                onClick={onStart} 
                style={{ 
                  width: '100%', minHeight: '112px', borderRadius: '16px', fontWeight: '800',
                  background: '#2563eb', color: '#ffffff', border: 'none', cursor: 'pointer',
                  fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.25)', transition: 'all 0.2s'
                }}
              >
                START
              </button>
            )}
            {availableActions.includes('resume') && (
              <button 
                onClick={onResume} 
                style={{ 
                  width: '100%', minHeight: '112px', borderRadius: '16px', fontWeight: '800',
                  background: '#2563eb', color: '#ffffff', border: 'none', cursor: 'pointer',
                  fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.25)', transition: 'all 0.2s'
                }}
              >
                RESUME
              </button>
            )}
            {availableActions.includes('enterShiftDetails') && (
              <button 
                onClick={onEnterShiftDetails} 
                style={{ 
                  width: '100%', minHeight: '112px', borderRadius: '16px', fontWeight: '800',
                  background: '#2563eb', color: '#ffffff', border: 'none', cursor: 'pointer',
                  fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.25)', transition: 'all 0.2s'
                }}
              >
                ENTER SHIFT DETAILS
              </button>
            )}

            {!isCancelled ? (
              <button 
                onClick={() => setShowCancelModal(true)} 
                style={{ 
                  width: '100%', 
                  minHeight: '112px', 
                  borderRadius: '16px', 
                  fontWeight: '800', 
                  background: '#ef4444', 
                  color: '#ffffff', 
                  border: 'none', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.25)',
                  transition: 'all 0.2s'
                }}
              >
                CANCEL CALL
              </button>
            ) : (
              <div 
                style={{ 
                  width: '100%', 
                  minHeight: '112px', 
                  borderRadius: '16px', 
                  fontWeight: '800', 
                  background: '#fef2f2', 
                  color: '#dc2626', 
                  border: '1px solid #fecaca', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px'
                }}
              >
                🚫 CALL CANCELLED
              </div>
            )}

            {/* Call Letter */}
            <button
              onClick={handleDownloadLetter}
              disabled={pdfLoading}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
                padding: '20px 14px', background: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
                border: '1px solid #a5f3fc', borderRadius: '16px',
                cursor: pdfLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease',
                color: '#0891b2', width: '100%', minHeight: '112px',
                boxShadow: '0 4px 6px -1px rgba(8, 145, 178, 0.1)'
              }}
            >
              <div style={{ width: '46px', height: '46px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </div>
              <span style={{ fontWeight: '800', fontSize: '14px' }}>{pdfLoading ? 'Generating...' : 'Call Letter'}</span>
            </button>

            {/* PO & MA */}
            <button
              onClick={downloadPoDoc}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
                padding: '20px 14px', background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                border: '1px solid #d8b4fe', borderRadius: '16px',
                cursor: 'pointer', transition: 'all 0.2s ease',
                color: '#7e22ce', width: '100%', minHeight: '112px',
                boxShadow: '0 4px 6px -1px rgba(126, 34, 206, 0.1)'
              }}
            >
              <div style={{ width: '46px', height: '46px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
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
