import React, { useState } from 'react';
import ShiftDutyForm from './ShiftDutyForm';

const PortalHome = ({ user, onModuleSelect, isShiftActive }) => {
  const [showShiftForm, setShowShiftForm] = useState(false);

  const handleStartDutyClick = () => {
    if (isShiftActive) {
      onModuleSelect('IE');
    } else {
      setShowShiftForm(true);
    }
  };

  const handleShiftSubmit = (shiftData) => {
    console.log('Shift Initialized:', shiftData);
    setShowShiftForm(false);
    onModuleSelect('IE');
  };

  return (
    <div className="portal-home-container" style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', width: '100%' }}>
      {showShiftForm && (
        <ShiftDutyForm 
          onSubmit={handleShiftSubmit}
          onCancel={() => setShowShiftForm(false)}
        />
      )}
      
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '800', 
            color: '#0f172a', 
            letterSpacing: '-0.025em',
            margin: '0 0 4px 0'
          }}>
            Railpad IE – Portal Home
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>
            Quality assurance and production management system
          </p>
        </div>
      </header>

      <div style={{ 
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Duty Management
          </h2>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 400px))', 
          gap: '20px'
        }}>
          {/* RailPad IE Module Card */}
          <div 
            onClick={handleStartDutyClick}
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              padding: '12px 16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '85px',
              boxSizing: 'border-box',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#eff6ff';
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
            }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              flex: 1,
              minWidth: 0,
              overflow: 'hidden'
            }}>
              <span style={{
                fontWeight: '700',
                fontSize: '13px',
                color: '#111827',
                lineHeight: '1.2'
              }}>
                {isShiftActive ? 'Resume Duty' : 'Start Duty'}
              </span>
              <span style={{
                fontSize: '11px',
                color: '#6b7280',
                fontWeight: '500',
                lineHeight: '1.1'
              }}>
                {isShiftActive 
                  ? 'Your current shift is active. Click to resume operations.' 
                  : 'Initialize your daily productivity and duty assignment.'}
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '12px',
              flexShrink: 0
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#338691',
                boxShadow: '0 4px 6px -1px rgba(51, 134, 145, 0.15), 0 2px 4px -1px rgba(51, 134, 145, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.8)'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}>
                  <path d="M7 4.5c0-.828.672-1.5 1.5-1.5.263 0 .52.07.747.202l11 6.5c.468.277.753.774.753 1.298s-.285 1.021-.753 1.298l-11 6.5c-.227.133-.484.202-.747.202-.828 0-1.5-.672-1.5-1.5v-13z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Rail Pad Final Inspection Card */}
          <div 
            onClick={() => {
              if (isShiftActive) {
                onModuleSelect('FINAL_INSPECTION');
              }
            }}
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              padding: '12px 16px',
              cursor: isShiftActive ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '85px',
              boxSizing: 'border-box',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              opacity: isShiftActive ? 1 : 0.7,
              position: 'relative'
            }}
            onMouseEnter={e => {
              if (isShiftActive) {
                e.currentTarget.style.background = '#f5f3ff';
                e.currentTarget.style.borderColor = '#8b5cf6';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
            }}
            title={!isShiftActive ? 'Please start duty to access final inspection' : ''}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              flex: 1,
              minWidth: 0,
              overflow: 'hidden'
            }}>
              <span style={{
                fontWeight: '700',
                fontSize: '13px',
                color: '#111827',
                lineHeight: '1.2'
              }}>
                Rail Pad Final Inspection
              </span>
              <span style={{
                fontSize: '11px',
                color: '#6b7280',
                fontWeight: '500',
                lineHeight: '1.1'
              }}>
                Perform comprehensive multi-layer quality acceptance tests.
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '12px',
              flexShrink: 0,
              position: 'relative'
            }}>
              {!isShiftActive && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  zIndex: 2
                }}>
                  🔒
                </div>
              )}
              <div style={{
                width: '40px',
                height: '40px',
                background: isShiftActive ? 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)' : '#f1f5f9',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isShiftActive ? '#7c3aed' : '#94a3b8',
                boxShadow: isShiftActive ? '0 4px 6px -1px rgba(124, 58, 237, 0.15)' : 'none',
                border: '1px solid rgba(255, 255, 255, 0.8)'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalHome;
