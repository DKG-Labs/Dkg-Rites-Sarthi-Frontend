import React, { useState, useEffect } from 'react';
import ShiftDutyForm from './ShiftDutyForm';
import PlantDeclarationDashboard from './PlantDeclaration/PlantDeclarationDashboard';

/* ─── Locked Card Overlay ─────────────────────────────────────────── */
const LockedCardOverlay = ({ visible }) => {
  if (!visible) return null;
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      borderRadius: '10px',
      background: 'rgba(15, 23, 42, 0.78)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      zIndex: 10,
      animation: 'overlayFadeIn 0.18s ease-out'
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        background: 'rgba(255,255,255,0.12)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#facc15', letterSpacing: '0.02em' }}>
        Start Duty First
      </p>
      <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: '500', textAlign: 'center', padding: '0 8px' }}>
        Click <strong style={{ color: '#fff' }}>Start Duty</strong> to unlock
      </p>
    </div>
  );
};

/* ─── Main Component ──────────────────────────────────────────────── */
const PortalHome = ({ user, onModuleSelect, isShiftActive, currentShift, defaultShowPlantDeclaration, onClosePlantDeclaration }) => {
  const roleLower = (user?.roleName || '').toLowerCase();
  const hasProcessAccess = roleLower.includes('process ie') || roleLower === 'railpad ie';
  const hasMainAccess = roleLower.includes('main ie') || roleLower === 'railpad ie';

  const dutyPlantId = currentShift?.unit || null;
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [showPlantDeclaration, setShowPlantDeclaration] = useState(false);
  const [hoveredLocked, setHoveredLocked] = useState(null); // 'calls' | 'plant' | null

  useEffect(() => {
    if (defaultShowPlantDeclaration) setShowPlantDeclaration(true);
  }, [defaultShowPlantDeclaration]);

  const handleStartDutyClick = () => {
    if (isShiftActive) {
      if (hasProcessAccess) {
        onModuleSelect('IE');
      }
    } else {
      setShowShiftForm(true);
    }
  };

  const handleShiftSubmit = (shiftData) => {
    setShowShiftForm(false);
    onModuleSelect('IE', shiftData);
  };

  const isClickableStartCard = !isShiftActive || hasProcessAccess;

  return (
    <div className="ph-root">
      <style>{`
        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .ph-root {
          padding: 24px;
          background: #f8fafc;
          min-height: 100vh;
          width: 100%;
          box-sizing: border-box;
        }

        .ph-header h1 {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.025em;
          margin: 0 0 4px 0;
        }
        .ph-header p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .ph-duty-panel {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .ph-duty-label {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          margin: 0 0 16px 0;
        }

        .ph-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .ph-card {
          position: relative;
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 90px;
          box-sizing: border-box;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          transition: all 0.2s ease;
          overflow: hidden;
        }
        .ph-card--clickable {
          cursor: pointer;
        }
        .ph-card--locked {
          cursor: not-allowed;
          opacity: 0.6;
        }
        .ph-card--disabled {
          cursor: default;
          opacity: 0.8;
        }
        .ph-card--active {
          border-color: #8b5cf6;
          background: #f5f3ff;
        }
        .ph-card--start:hover:not(.ph-card--disabled) {
          background: #eff6ff;
          border-color: #3b82f6;
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(59,130,246,0.12);
        }
        .ph-card--calls:hover:not(.ph-card--locked) {
          background: #f0fdfa;
          border-color: #14b8a6;
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(20,184,166,0.12);
        }
        .ph-card--plant:hover:not(.ph-card--locked):not(.ph-card--active) {
          background: #f5f3ff;
          border-color: #8b5cf6;
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(109,40,217,0.12);
        }

        .ph-card-text { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
        .ph-card-title { font-weight: 700; font-size: 13px; color: #111827; line-height: 1.2; }
        .ph-card-sub   { font-size: 11px; color: #6b7280; font-weight: 500; line-height: 1.2; }
        .ph-card-icon-wrap { display: flex; align-items: center; justify-content: center; margin-left: 12px; flex-shrink: 0; }
        .ph-card-icon {
          width: 40px; height: 40px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(255,255,255,0.8);
        }

        .ph-plant-panel {
          margin-top: 24px;
          background: white;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          animation: fadeInUp 0.35s ease-out;
        }
        .ph-plant-close-row {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 12px;
        }
        .ph-close-btn {
          background: #f1f5f9;
          border: none;
          border-radius: 8px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          transition: background 0.2s;
        }
        .ph-close-btn:hover { background: #e2e8f0; }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .ph-root { padding: 16px; }
          .ph-header h1 { font-size: 22px; }
          .ph-cards-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .ph-card { min-height: 76px; }
          .ph-plant-panel { padding: 16px; }
        }

        @media (min-width: 480px) and (max-width: 768px) {
          .ph-cards-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      {showShiftForm && (
        <ShiftDutyForm
          onSubmit={handleShiftSubmit}
          onCancel={() => setShowShiftForm(false)}
        />
      )}

      <header className="ph-header" style={{ marginBottom: '28px' }}>
        <h1>Railpad IE – Portal Home</h1>
        <p>Quality assurance and production management system</p>
      </header>

      <div className="ph-duty-panel">
        <p className="ph-duty-label">Duty Management</p>

        <div className="ph-cards-grid">

          {/* ── Start Duty Card ────────────────────────────── */}
          <div
            className={`ph-card ${isClickableStartCard ? 'ph-card--clickable' : 'ph-card--disabled'} ph-card--start`}
            onClick={isClickableStartCard ? handleStartDutyClick : undefined}
          >
            <div className="ph-card-text">
              <span className="ph-card-title">
                {isShiftActive 
                  ? (hasProcessAccess ? 'Resume Duty' : 'Duty Active') 
                  : 'Start Duty'}
              </span>
              <span className="ph-card-sub">
                {isShiftActive
                  ? (hasProcessAccess 
                      ? 'Your shift is active. Click to resume operations.' 
                      : 'Your shift is active. Main IE functions unlocked.')
                  : 'Initialize your daily productivity and duty assignment.'}
              </span>
            </div>
            <div className="ph-card-icon-wrap">
              <div className="ph-card-icon" style={{
                background: 'linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)',
                color: '#338691',
                boxShadow: '0 4px 6px -1px rgba(51,134,145,0.15)'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 4.5c0-.828.672-1.5 1.5-1.5.263 0 .52.07.747.202l11 6.5c.468.277.753.774.753 1.298s-.285 1.021-.753 1.298l-11 6.5c-.227.133-.484.202-.747.202-.828 0-1.5-.672-1.5-1.5v-13z" />
                </svg>
              </div>
            </div>
          </div>

          {/* ── Attending the Call Raised Card ─────────────── */}
          {hasMainAccess && (
            <div
              className={`ph-card ph-card--calls ${isShiftActive ? 'ph-card--clickable' : 'ph-card--locked'}`}
              onClick={() => { if (!isShiftActive) return; onModuleSelect('ATTENDING_CALLS'); }}
              onMouseEnter={() => { if (!isShiftActive) setHoveredLocked('calls'); }}
              onMouseLeave={() => setHoveredLocked(null)}
            >
              <LockedCardOverlay visible={hoveredLocked === 'calls' && !isShiftActive} />
              <div className="ph-card-text">
                <span className="ph-card-title">Attending the Call Raised</span>
                <span className="ph-card-sub">Manage Call Inspection &amp; IC Issuance</span>
              </div>
              <div className="ph-card-icon-wrap">
                <div className="ph-card-icon" style={{
                  background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
                  color: '#0d9488',
                  boxShadow: '0 4px 6px -1px rgba(13,148,136,0.15)'
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72(12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* ── Plant Setup & Declaration Card ─────────────── */}
          {hasMainAccess && (
            <div
              className={`ph-card ph-card--plant ${isShiftActive ? 'ph-card--clickable' : 'ph-card--locked'} ${showPlantDeclaration ? 'ph-card--active' : ''}`}
              onClick={() => {
                if (!isShiftActive) return;
                const next = !showPlantDeclaration;
                setShowPlantDeclaration(next);
                if (!next && onClosePlantDeclaration) onClosePlantDeclaration();
              }}
              onMouseEnter={() => { if (!isShiftActive) setHoveredLocked('plant'); }}
              onMouseLeave={() => setHoveredLocked(null)}
            >
              <LockedCardOverlay visible={hoveredLocked === 'plant' && !isShiftActive} />
              <div className="ph-card-text">
                <span className="ph-card-title">Plant Setup &amp; Declaration</span>
                <span className="ph-card-sub">Verify Plant Setup, Recipes &amp; QAP limits</span>
              </div>
              <div className="ph-card-icon-wrap">
                <div className="ph-card-icon" style={{
                  background: 'linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 100%)',
                  color: '#6d28d9',
                  boxShadow: '0 4px 6px -1px rgba(109,40,217,0.15)'
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="9" y1="9" x2="15" y2="9"/>
                    <line x1="9" y1="13" x2="15" y2="13"/>
                    <line x1="9" y1="17" x2="15" y2="17"/>
                  </svg>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {showPlantDeclaration && (
        <div className="ph-plant-panel">
          <div className="ph-plant-close-row">
            <button
              className="ph-close-btn"
              onClick={() => {
                setShowPlantDeclaration(false);
                if (onClosePlantDeclaration) onClosePlantDeclaration();
              }}
            >
              Close Baseline Panel ×
            </button>
          </div>
          <PlantDeclarationDashboard dutyPlantId={dutyPlantId} />
        </div>
      )}
    </div>
  );
};

export default PortalHome;
