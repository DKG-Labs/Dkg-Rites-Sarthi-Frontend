import './RejectionBreakupModal.css';

const STAGE_COLORS = {
  'Shearing':            { border: '#f59e0b', badge: '#d97706', label: '#92400e', dot: '#f59e0b' },
  'Turning':             { border: '#3b82f6', badge: '#2563eb', label: '#1e3a8a', dot: '#3b82f6' },
  'MPI':                 { border: '#a855f7', badge: '#9333ea', label: '#581c87', dot: '#a855f7' },
  'Forging':             { border: '#f97316', badge: '#ea580c', label: '#7c2d12', dot: '#f97316' },
  'Quenching':           { border: '#14b8a6', badge: '#0d9488', label: '#134e4a', dot: '#14b8a6' },
  'Tempering':           { border: '#f43f5e', badge: '#e11d48', label: '#881337', dot: '#f43f5e' },
  'Final Check':         { border: '#22c55e', badge: '#16a34a', label: '#14532d', dot: '#22c55e' },
  'Testing & Finishing': { border: '#6366f1', badge: '#4f46e5', label: '#1e1b4b', dot: '#6366f1' },
  'Visual Inspection':      { border: '#3b82f6', badge: '#2563eb', label: '#1e3a8a', dot: '#3b82f6' },
  'Dimensional Inspection': { border: '#f97316', badge: '#ea580c', label: '#7c2d12', dot: '#f97316' },
  'Hardness Test':          { border: '#a855f7', badge: '#9333ea', label: '#581c87', dot: '#a855f7' },
  'Freedom from Defects':   { border: '#14b8a6', badge: '#0d9488', label: '#134e4a', dot: '#14b8a6' },
  'Toe Load Test':          { border: '#f43f5e', badge: '#e11d48', label: '#881337', dot: '#f43f5e' },
  'Weight Test':            { border: '#22c55e', badge: '#16a34a', label: '#14532d', dot: '#22c55e' },
};

const DEFAULT_COLOR = { border: '#94a3b8', badge: '#64748b', label: '#334155', dot: '#94a3b8' };

function AnalysisIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18"/>
      <path d="m19 9-5 5-4-4-3 3"/>
    </svg>
  );
}

function SkeletonCards() {
  return (
    <div className="rbm-card-grid">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="rbm-card rbm-card-skel">
          <div className="rbm-skel-title" />
          <div className="rbm-skel-line" />
          <div className="rbm-skel-line rbm-skel-short" />
          <div className="rbm-skel-total" />
        </div>
      ))}
    </div>
  );
}

export default function RejectionBreakupModal({ row, data, loading, error, onClose }) {
  if (!row) return null;

  const isProcess = row.stageOfInspection === 'PROCESS';
  const title = isProcess ? 'Process Rejection Breakdown' : 'Final Inspection Breakdown';
  const sections = data?.stageSections || [];
  const grandTotal = sections.reduce((s, sec) => s + sec.totalRejected, 0);

  return (
    <div className="rbm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="rbm-box">

        {/* Header */}
        <div className="rbm-header">
          <div className="rbm-header-left">
            <div className="rbm-title-row">
              <div className="rbm-icon-wrap">
                <AnalysisIcon />
              </div>
              <div>
                <div className="rbm-title">{title}</div>
                <div className="rbm-subtitle">Per-stage defect breakdown</div>
              </div>
            </div>
            <div className="rbm-meta">
              <span className="rbm-chip">
                <span className="rbm-chip-dot" />
                {row.entryDate}
              </span>
              {row.shift && (
                <span className="rbm-chip">
                  <span className="rbm-chip-dot" />
                  Shift {row.shift}
                </span>
              )}
              {row.unitLineShedNo && (
                <span className="rbm-chip">
                  <span className="rbm-chip-dot" />
                  {row.unitLineShedNo}
                </span>
              )}
              <span className="rbm-chip rbm-chip-red">
                <span className="rbm-chip-dot" />
                {row.rejectedQty} Rejected
              </span>
            </div>
          </div>
          <button className="rbm-close" onClick={onClose} title="Close">✕</button>
        </div>

        {/* Body */}
        <div className="rbm-body">
          {loading ? (
            <SkeletonCards />
          ) : error ? (
            <div className="rbm-error">⚠ {error}</div>
          ) : sections.length === 0 ? (
            <div className="rbm-empty">
              <div className="rbm-empty-icon">🔍</div>
              <p>No defect breakdown data found for this entry.</p>
            </div>
          ) : (
            <>
              {/* Summary strip */}
              <div className="rbm-summary-strip">
                <span className="rbm-summary-label">Active stages</span>
                <div className="rbm-summary-stages">
                  {sections.map(sec => {
                    const color = STAGE_COLORS[sec.stageName] || DEFAULT_COLOR;
                    return (
                      <span
                        key={sec.stageName}
                        className="rbm-summary-dot"
                        style={{ '--dot-color': color.dot }}
                      >
                        {sec.stageName} · {sec.totalRejected}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Stage cards */}
              <div className="rbm-card-grid">
                {sections.map(section => {
                  const color = STAGE_COLORS[section.stageName] || DEFAULT_COLOR;
                  const maxDefect = section.defects
                    ? Math.max(...section.defects.map(d => d.rejectedQty), 1)
                    : 1;
                  return (
                    <div
                      key={section.stageName}
                      className="rbm-card"
                      style={{ borderLeftColor: color.border }}
                    >
                      <div className="rbm-card-header">
                        <span className="rbm-stage-name" style={{ color: color.label }}>
                          {section.stageName}
                        </span>
                        <span className="rbm-stage-total" style={{ background: color.badge }}>
                          {section.totalRejected} pcs
                        </span>
                      </div>

                      {section.defects && section.defects.length > 0 && (
                        <div className="rbm-defect-list">
                          {section.defects.map(d => (
                            <div key={d.defectName} className="rbm-defect-row">
                              <span className="rbm-defect-name">{d.defectName}</span>
                              <div className="rbm-defect-bar-wrap">
                                <div
                                  className="rbm-defect-bar"
                                  style={{
                                    width: `${Math.round((d.rejectedQty / maxDefect) * 100)}%`,
                                    '--bar-color': color.badge,
                                  }}
                                />
                              </div>
                              <span className="rbm-defect-count" style={{ color: color.badge }}>
                                {d.rejectedQty}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {sections.length > 0 && (
          <div className="rbm-footer">
            <span className="rbm-footer-note">
              {sections.length} stage{sections.length !== 1 ? 's' : ''} · {grandTotal} total rejections
            </span>
            <button className="rbm-close-btn" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
