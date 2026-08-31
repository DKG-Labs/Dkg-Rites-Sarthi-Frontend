import React, { useState, useEffect } from 'react';
import ShiftDutyForm from './ShiftDutyForm';
import PlantDeclarationDashboard from './PlantDeclaration/PlantDeclarationDashboard';
import AttendingCallsDashboard from './AttendingCallsDashboard';
import { 
  fetchPendingWorkflowTransitions, 
  fetchCompletedCalls, 
  fetchMappedPlantIds, 
  isPlantIdMatching 
} from '../services/workflowService';

/* ─── Locked Card Overlay ─────────────────────────────────────────── */
const LockedCardOverlay = ({ visible }) => {
  if (!visible) return null;
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      borderRadius: '12px',
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      zIndex: 10,
      animation: 'overlayFadeIn 0.2s ease-out'
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        background: '#fef3c7',
        border: '1px solid #fde68a',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#d97706'
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#92400e' }}>
        Start Duty Required
      </p>
      <p style={{ margin: 0, fontSize: '10px', color: '#b45309', fontWeight: '500' }}>
        Click <strong>Start Duty</strong> to unlock
      </p>
    </div>
  );
};

/* ─── Main Component ──────────────────────────────────────────────── */
const PortalHome = ({ 
  user, 
  onModuleSelect, 
  onStart, 
  onResume, 
  onIssueIc, 
  isShiftActive, 
  currentShift, 
  defaultShowPlantDeclaration, 
  onClosePlantDeclaration 
}) => {
  const [isMainIeMapped, setIsMainIeMapped] = useState(false);
  const [isProcessIeMapped, setIsProcessIeMapped] = useState(false);
  const [mappedPlants, setMappedPlants] = useState([]);
  const [mainCounts, setMainCounts] = useState({ pending: 0, certificates: 0, completed: 0 });
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [selectedMainTab, setSelectedMainTab] = useState('pending'); // 'pending' | 'certificates' | 'completed' | 'plant'

  const roleInput = user?.roleName || localStorage.getItem('roleName') || '';
  const roleLower = (Array.isArray(roleInput) ? roleInput.join(' ') : String(roleInput)).toLowerCase();

  const isStrictMainIe = (roleLower.includes('main ie') || roleLower.includes('rail main ie') || isMainIeMapped) && !roleLower.includes('process ie');
  const hasProcessAccess = roleLower.includes('process ie') || roleLower.includes('rail process ie') || roleLower === 'railpad ie' || isProcessIeMapped;
  const hasMainAccess = roleLower.includes('main ie') || roleLower.includes('rail main ie') || roleLower === 'railpad ie' || isMainIeMapped;

  const dutyPlantId = isStrictMainIe ? null : (currentShift?.unit || null);
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [showPlantDeclaration, setShowPlantDeclaration] = useState(false);
  const [hoveredLocked, setHoveredLocked] = useState(null); // 'calls' | 'plant' | null

  useEffect(() => {
    if (defaultShowPlantDeclaration) {
      if (isStrictMainIe) {
        setSelectedMainTab('plant');
      } else {
        setShowPlantDeclaration(true);
      }
    }
  }, [defaultShowPlantDeclaration, isStrictMainIe]);

  // Check mappings for user
  useEffect(() => {
    const checkMappingsAndCounts = async () => {
      const uId = user?.userId || localStorage.getItem('userId');
      if (!uId) return;

      try {
        const mainPlants = await fetchMappedPlantIds(uId, 'Main IE');
        if (mainPlants && mainPlants.length > 0) {
          setIsMainIeMapped(true);
          setMappedPlants(mainPlants);
        }
        const processPlants = await fetchMappedPlantIds(uId, 'Process IE');
        if (processPlants && processPlants.length > 0) {
          setIsProcessIeMapped(true);
        }

        // If Main IE, fetch live counts filtered by mapped plants
        if (roleLower.includes('main ie') || roleLower.includes('rail main ie') || (mainPlants && mainPlants.length > 0)) {
          setLoadingCounts(true);
          const [pendingRes, completedRes] = await Promise.all([
            fetchPendingWorkflowTransitions('Rail Main IE', '', 2).catch(() => []),
            fetchCompletedCalls('', 2).catch(() => [])
          ]);

          let rpPending = (pendingRes || []).filter(c => c.requestId);
          let rpCompletedAll = (completedRes || []).filter(c => c.requestId);

          if (mainPlants && mainPlants.length > 0) {
            rpPending = rpPending.filter(c => !c.plantId || mainPlants.some(p => isPlantIdMatching(c.plantId, p)));
            rpCompletedAll = rpCompletedAll.filter(c => !c.plantId || mainPlants.some(p => isPlantIdMatching(c.plantId, p)));
          }

          const isCallSignedAndCompleted = (c) => {
            const action = (c.action || '').toUpperCase();
            const status = (c.status || '').toUpperCase();
            const jobStatus = (c.jobStatus || '').toUpperCase();
            return action === 'GENERATE_IC' ||
                   action === 'DSC_SIGN_IC' ||
                   action === 'IC_GENERATION' ||
                   status === 'GENERATE_IC' ||
                   jobStatus === 'GENERATE_IC' ||
                   status === 'DSC_SIGN_IC' ||
                   jobStatus === 'DSC_SIGN_IC' ||
                   status === 'IC_GENERATION' ||
                   jobStatus === 'IC_GENERATION' ||
                   status === 'GENERATED' ||
                   jobStatus === 'GENERATED' ||
                   status === 'IC_SIGNED' ||
                   jobStatus === 'IC_SIGNED' ||
                   status.includes('CANCEL') ||
                   jobStatus.includes('CANCEL') ||
                   action.includes('CANCEL');
          };

          const certs = rpCompletedAll.filter(c => !isCallSignedAndCompleted(c));
          const completed = rpCompletedAll.filter(c => isCallSignedAndCompleted(c));

          setMainCounts({
            pending: rpPending.length,
            certificates: certs.length,
            completed: completed.length
          });
          setLoadingCounts(false);
        }
      } catch (err) {
        console.error('Error checking IE mappings & counts:', err);
        setLoadingCounts(false);
      }
    };
    checkMappingsAndCounts();
  }, [user?.userId, roleLower]);

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
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .ph-root {
          padding: 0 0 20px 0;
          background: #ffffff;
          min-height: 100vh;
          width: 100%;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        /* ── Modern Sleek Header ── */
        .ph-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding-bottom: 14px;
          margin-bottom: 18px;
          border-bottom: 1px solid #f1f5f9;
        }

        .ph-header-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: #0284c7;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 4px;
        }

        .ph-header-title {
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
          letter-spacing: -0.02em;
          margin: 0 0 4px 0;
        }

        .ph-header-sub {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          font-weight: 400;
        }

        .ph-mapped-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
        }

        .ph-pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 2.5px rgba(16, 185, 129, 0.25);
        }

        /* ── Grid & Cards ── */
        .ph-cards-container {
          margin-bottom: 24px;
        }

        .ph-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }

        .ph-card {
          position: relative;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 90px;
          box-sizing: border-box;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
          transition: all 0.2s ease;
          overflow: hidden;
          cursor: pointer;
          user-select: none;
        }

        .ph-card:hover {
          transform: translateY(-2px);
          border-color: #cbd5e1;
          box-shadow: 0 6px 16px -4px rgba(15, 23, 42, 0.08);
        }

        /* ── Active Selection Card Styles ── */
        .ph-card--active-pending {
          border-color: #3b82f6 !important;
          background: #f8faff !important;
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.12) !important;
        }
        .ph-card--active-pending::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: #2563eb;
        }

        .ph-card--active-certificates {
          border-color: #0d9488 !important;
          background: #f0fdfa !important;
          box-shadow: 0 4px 14px rgba(13, 148, 136, 0.12) !important;
        }
        .ph-card--active-certificates::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: #0d9488;
        }

        .ph-card--active-completed {
          border-color: #10b981 !important;
          background: #f0fdf4 !important;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.12) !important;
        }
        .ph-card--active-completed::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: #10b981;
        }

        .ph-card--active-plant {
          border-color: #8b5cf6 !important;
          background: #faf5ff !important;
          box-shadow: 0 4px 14px rgba(139, 92, 246, 0.12) !important;
        }
        .ph-card--active-plant::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: #8b5cf6;
        }

        .ph-card-text {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex: 1;
          min-width: 0;
        }
        .ph-card-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ph-card-title {
          font-weight: 700;
          font-size: 13.5px;
          color: #1e293b;
          line-height: 1.25;
        }
        .ph-card-sub {
          font-size: 11.5px;
          color: #64748b;
          font-weight: 400;
          line-height: 1.3;
        }

        /* ── Modern Badges ── */
        .ph-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
        }
        .ph-badge--blue {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #dbeafe;
        }
        .ph-badge--teal {
          background: #f0fdfa;
          color: #0f766e;
          border: 1px solid #ccfbf1;
        }
        .ph-badge--green {
          background: #f0fdf4;
          color: #15803d;
          border: 1px solid #dcfce7;
        }
        .ph-badge--purple {
          background: #faf5ff;
          color: #7e22ce;
          border: 1px solid #f3e8ff;
        }

        /* ── Icon Boxes ── */
        .ph-card-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 12px;
          flex-shrink: 0;
        }
        .ph-card-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
        }
        .ph-card:hover .ph-card-icon {
          transform: scale(1.05);
        }

        .ph-card-icon--blue {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #dbeafe;
        }
        .ph-card-icon--teal {
          background: #f0fdfa;
          color: #0d9488;
          border: 1px solid #ccfbf1;
        }
        .ph-card-icon--green {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #dcfce7;
        }
        .ph-card-icon--purple {
          background: #faf5ff;
          color: #8b5cf6;
          border: 1px solid #ede9fe;
        }

        /* ── Embedded Bottom Panel ── */
        .ph-main-embedded-panel {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          overflow: hidden;
          animation: fadeInUp 0.2s ease-out;
        }

        .ph-plant-panel {
          background: #ffffff;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e2e8f0;
          animation: fadeInUp 0.2s ease-out;
        }

        /* ── Mobile Responsive ── */
        @media (max-width: 768px) {
          .ph-root { padding: 16px; }
          .ph-header-title { font-size: 18px; }
          .ph-cards-grid { grid-template-columns: 1fr; gap: 10px; }
        }
      `}</style>

      {showShiftForm && (
        <ShiftDutyForm
          onSubmit={handleShiftSubmit}
          onCancel={() => setShowShiftForm(false)}
        />
      )}

      {/* ── Top Header Bar ── */}
      <header className="ph-header-bar">
        <div>
          <div className="ph-header-tag">
            <span>⚡ Quality Assurance</span>
            <span>•</span>
            <span>Operations Dashboard</span>
          </div>
          <h1 className="ph-header-title" style={{ margin: 0 }}>
            {isStrictMainIe ? 'Railpad Main IE – Operations Portal' : 'Railpad IE – Portal Home'}
          </h1>
        </div>

        {isStrictMainIe && mappedPlants.length > 0 && (
          <div className="ph-mapped-pill">
            <span className="ph-pulse-dot"></span>
            <span style={{ color: '#64748b' }}>Assigned Units:</span>
            <span style={{ color: '#0284c7', fontWeight: '700' }}>{mappedPlants.join(', ')}</span>
          </div>
        )}
      </header>

      {/* ============================================================ */}
      {/* CASE 1: STRICT MAIN IE (Direct 4 Operational Selection Cards) */}
      {/* ============================================================ */}
      {isStrictMainIe ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Top 4 Navigation/Selector Cards */}
          <div className="ph-cards-container">
            <div className="ph-cards-grid">
              
              {/* Card 1: List of Pending Calls */}
              <div
                className={`ph-card ${selectedMainTab === 'pending' ? 'ph-card--active-pending' : ''}`}
                onClick={() => setSelectedMainTab('pending')}
              >
                <div className="ph-card-text">
                  <div className="ph-card-title-row">
                    <span className="ph-card-title">List of Pending Calls</span>
                    <span className="ph-badge ph-badge--blue">
                      {loadingCounts ? '...' : `${mainCounts.pending} Pending`}
                    </span>
                  </div>
                  <span className="ph-card-sub">Review &amp; initiate inspection calls</span>
                </div>
                <div className="ph-card-icon-wrap">
                  <div className="ph-card-icon ph-card-icon--blue">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                      <line x1="9" y1="12" x2="15" y2="12"/>
                      <line x1="9" y1="16" x2="13" y2="16"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 2: Issuance of IC & Annexure */}
              <div
                className={`ph-card ${selectedMainTab === 'certificates' ? 'ph-card--active-certificates' : ''}`}
                onClick={() => setSelectedMainTab('certificates')}
              >
                <div className="ph-card-text">
                  <div className="ph-card-title-row">
                    <span className="ph-card-title">Issuance of IC &amp; Annexure</span>
                    <span className="ph-badge ph-badge--teal">
                      {loadingCounts ? '...' : `${mainCounts.certificates} Ready`}
                    </span>
                  </div>
                  <span className="ph-card-sub">Review test annexures &amp; issue IC</span>
                </div>
                <div className="ph-card-icon-wrap">
                  <div className="ph-card-icon ph-card-icon--teal">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 3: Completed Calls */}
              <div
                className={`ph-card ${selectedMainTab === 'completed' ? 'ph-card--active-completed' : ''}`}
                onClick={() => setSelectedMainTab('completed')}
              >
                <div className="ph-card-text">
                  <div className="ph-card-title-row">
                    <span className="ph-card-title">Completed Calls</span>
                    <span className="ph-badge ph-badge--green">
                      {loadingCounts ? '...' : `${mainCounts.completed} Issued`}
                    </span>
                  </div>
                  <span className="ph-card-sub">Archive of signed ICs &amp; reports</span>
                </div>
                <div className="ph-card-icon-wrap">
                  <div className="ph-card-icon ph-card-icon--green">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 4: Plant Setup & Declaration */}
              <div
                className={`ph-card ${selectedMainTab === 'plant' ? 'ph-card--active-plant' : ''}`}
                onClick={() => setSelectedMainTab('plant')}
              >
                <div className="ph-card-text">
                  <div className="ph-card-title-row">
                    <span className="ph-card-title">Plant Setup &amp; Declaration</span>
                    <span className="ph-badge ph-badge--purple">
                      {mappedPlants.length > 0 ? `${mappedPlants.length} Plants` : 'Active'}
                    </span>
                  </div>
                  <span className="ph-card-sub">Verify setups, recipes &amp; QAP limits</span>
                </div>
                <div className="ph-card-icon-wrap">
                  <div className="ph-card-icon ph-card-icon--purple">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <line x1="9" y1="9" x2="15" y2="9"/>
                      <line x1="9" y1="13" x2="15" y2="13"/>
                      <line x1="9" y1="17" x2="15" y2="17"/>
                    </svg>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Embedded Content Table Directly Beneath the Cards */}
          <div className="ph-main-embedded-panel">
            {selectedMainTab === 'plant' ? (
              <div style={{ padding: '24px' }}>
                <PlantDeclarationDashboard dutyPlantId={dutyPlantId} />
              </div>
            ) : (
              <AttendingCallsDashboard
                controlledTab={selectedMainTab}
                hideTopHeader={true}
                hideTopTabs={true}
                dutyPlantId={dutyPlantId}
                onStart={onStart}
                onResume={onResume}
                onIssueIc={onIssueIc}
                onCountsChange={(newCounts) => {
                  if (newCounts) {
                    setMainCounts(newCounts);
                  }
                }}
              />
            )}
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* CASE 2: PROCESS IE / OTHERS (Preserved exact existing layout) */
        /* ============================================================ */
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 16px 0' }}>
            Duty Management
          </p>

          <div className="ph-cards-grid">

            {/* ── Start Duty Card ────────────────────────────── */}
            <div
              className={`ph-card ${isClickableStartCard ? 'ph-card--clickable' : ''}`}
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
                  background: '#f0fdfa',
                  color: '#0d9488',
                  border: '1px solid #ccfbf1'
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
                className={`ph-card ${isShiftActive ? 'ph-card--clickable' : ''}`}
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
                    background: '#f0fdfa',
                    color: '#0d9488',
                    border: '1px solid #ccfbf1'
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* ── Plant Setup & Declaration Card ─────────────── */}
            {hasMainAccess && (
              <div
                className={`ph-card ${isShiftActive ? 'ph-card--clickable' : ''}`}
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
                    background: '#faf5ff',
                    color: '#8b5cf6',
                    border: '1px solid #ede9fe'
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
      )}

      {showPlantDeclaration && !isStrictMainIe && (
        <div className="ph-plant-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
              🏭 Plant Setup &amp; Baseline Declaration Review
            </h4>
            <button
              onClick={() => {
                setShowPlantDeclaration(false);
                if (onClosePlantDeclaration) onClosePlantDeclaration();
              }}
              style={{
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '700',
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              Close Panel ×
            </button>
          </div>
          <PlantDeclarationDashboard dutyPlantId={dutyPlantId} />
        </div>
      )}
    </div>
  );
};

export default PortalHome;
