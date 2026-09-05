import React from 'react';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import AttachmentRoundedIcon from '@mui/icons-material/AttachmentRounded';
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import StatusBadge from './StatusBadge';
import { getDetailedStatus } from '../utils/statusMapper';
import { getProductTypeDisplayName, formatDate } from '../utils/helpers';

const IssuanceCallDetailsModal = ({
  isOpen,
  onClose,
  call,
  onIssueIC,
  onViewAnnexures,
  onBackToInspection,
  isLoadingCertificate = false
}) => {
  if (!isOpen || !call) return null;

  const { mainStatus, combinedText } = getDetailedStatus(call.status);
  const isViewMode = call.originalStatus === 'GENERATE_IC';

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '920px',
          width: '95%',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          backgroundColor: '#ffffff'
        }}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h2
            className="modal-title"
            style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ color: '#0ea5e9' }}>📋</span> Inspection Call Actions -{' '}
            <span style={{ color: '#0284c7' }}>{call.call_no || call.callNumber}</span>
          </h2>
          <button
            className="modal-close"
            onClick={onClose}
            style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: '#64748b',
              fontSize: '1.2rem',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.borderColor = '#fecaca';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = '#64748b';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ maxHeight: '80vh', overflowY: 'auto', padding: '28px 24px' }}>
          {/* Top Summary Section */}
          <div
            style={{
              background: 'linear-gradient(to right, #ffffff, #f8fafc)',
              padding: '20px 24px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #0ea5e9',
              marginBottom: '28px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '20px'
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: '11px',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '700',
                    marginBottom: '4px',
                    display: 'block'
                  }}
                >
                  Call Number
                </label>
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>
                  {call.call_no || call.callNumber || '-'}
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '11px',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '700',
                    marginBottom: '4px',
                    display: 'block'
                  }}
                >
                  Vendor Name
                </label>
                <div style={{ fontWeight: '600', fontSize: '14.5px', color: '#0f172a' }}>
                  {call.vendor_name || call.vendorName || '-'}
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '11px',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '700',
                    marginBottom: '4px',
                    display: 'block'
                  }}
                >
                  PO Number
                </label>
                <div style={{ fontWeight: '600', fontSize: '14.5px', color: '#0f172a' }}>
                  {call.po_no || call.poNumber || '-'}
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '11px',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '700',
                    marginBottom: '4px',
                    display: 'block'
                  }}
                >
                  IBS Case No.
                </label>
                <div style={{ fontWeight: '600', fontSize: '14.5px', color: '#0f172a' }}>
                  {call.ibsCaseNo || call.caseNo || call.case_no || '-'}
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '11px',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '700',
                    marginBottom: '4px',
                    display: 'block'
                  }}
                >
                  Product Type
                </label>
                <div
                  style={{
                    display: 'inline-block',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    padding: '3px 10px',
                    borderRadius: '16px',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  {getProductTypeDisplayName(call.product_type || call.productType) || '-'}
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '11px',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '700',
                    marginBottom: '4px',
                    display: 'block'
                  }}
                >
                  Inspection Date
                </label>
                <div style={{ fontWeight: '600', fontSize: '14.5px', color: '#0f172a' }}>
                  {formatDate(call.requested_date || call.created_at || call.createdAt) || '-'}
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '11px',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '700',
                    marginBottom: '4px',
                    display: 'block'
                  }}
                >
                  Stage
                </label>
                <div style={{ fontWeight: '600', fontSize: '14.5px', color: '#0f172a' }}>
                  {call.stage || '-'}
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '11px',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '700',
                    marginBottom: '4px',
                    display: 'block'
                  }}
                >
                  Status
                </label>
                <div>
                  <StatusBadge status={mainStatus} text={combinedText} />
                </div>
              </div>
            </div>
          </div>

          {/* Action Cards Header */}
          <h3
            style={{
              fontSize: '17px',
              fontWeight: '700',
              marginBottom: '18px',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ color: '#3b82f6' }}>⚡</span> Available Call Actions
          </h3>

          {/* Action Buttons Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px'
            }}
          >
            {/* 1. Issue / View IC Action */}
            <button
              onClick={() => {
                onClose();
                onIssueIC(call);
              }}
              disabled={isLoadingCertificate}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '22px 16px',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '1px solid #bfdbfe',
                borderRadius: '16px',
                cursor: isLoadingCertificate ? 'not-allowed' : 'pointer',
                transition: 'all 0.25s ease',
                color: '#1d4ed8',
                width: '100%',
                boxShadow: '0 4px 6px -1px rgba(29, 78, 216, 0.08)'
              }}
              onMouseEnter={(e) => {
                if (!isLoadingCertificate) {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(29, 78, 216, 0.16)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoadingCertificate) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(29, 78, 216, 0.08)';
                }
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  background: '#ffffff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                }}
              >
                <DescriptionRoundedIcon style={{ fontSize: '25px', color: '#2563eb' }} />
              </div>
              <span style={{ fontWeight: '700', fontSize: '15px' }}>
                {isLoadingCertificate ? 'Loading...' : isViewMode ? 'View Inspection Certificate' : 'Issue IC (Certificate)'}
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {isViewMode ? 'Open generated IC document' : 'Generate certificate for signing'}
              </span>
            </button>

            {/* 2. Technical Annexures Action */}
            <button
              onClick={() => {
                onClose();
                onViewAnnexures(call);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '22px 16px',
                background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                border: '1px solid #d8b4fe',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                color: '#7e22ce',
                width: '100%',
                boxShadow: '0 4px 6px -1px rgba(126, 34, 206, 0.08)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(126, 34, 206, 0.16)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(126, 34, 206, 0.08)';
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  background: '#ffffff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                }}
              >
                <AttachmentRoundedIcon style={{ fontSize: '25px', color: '#7e22ce' }} />
              </div>
              <span style={{ fontWeight: '700', fontSize: '15px' }}>Technical Annexures</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>View test records & inspection sheets</span>
            </button>

            {/* 3. Back to Inspection Action */}
            <button
              onClick={() => {
                onClose();
                onBackToInspection(call);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '22px 16px',
                background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
                border: '1px solid #fecdd3',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                color: '#be123c',
                width: '100%',
                boxShadow: '0 4px 6px -1px rgba(190, 18, 60, 0.08)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(190, 18, 60, 0.16)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(190, 18, 60, 0.08)';
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  background: '#ffffff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                }}
              >
                <UndoRoundedIcon style={{ fontSize: '25px', color: '#be123c' }} />
              </div>
              <span style={{ fontWeight: '700', fontSize: '15px' }}>Back to Inspection</span>
              <span style={{ fontSize: '12px', color: '#881337' }}>Rollback & re-enter test data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssuanceCallDetailsModal;
