import { useNavigate, useLocation } from 'react-router-dom';
import { PROCESS_SUBMODULE_ROUTES } from '../routes';
import './SubmoduleNav.css';

/**
 * Process Material Submodule Navigation
 * Allows toggling between submodules without going back to dashboard
 * Uses React Router for URL-based navigation
 */

const PROCESS_SUBMODULES = [
  { id: 'process-calibration-documents', label: 'Calibration', icon: '📄' },
  { id: 'process-static-periodic-check', label: 'Static Check', icon: '⚙️' },
  { id: 'process-parameters-grid', label: '8 Hr Grid', icon: '🔬' },
  { id: 'process-summary-reports', label: 'Reports', icon: '📊' },
];

const ProcessSubmoduleNav = ({ currentSubmodule, onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current submodule from URL if not provided
  const getCurrentSubmodule = () => {
    if (currentSubmodule) return currentSubmodule;
    const path = location.pathname;
    for (const [id, route] of Object.entries(PROCESS_SUBMODULE_ROUTES)) {
      if (path === route) return id;
    }
    return null;
  };

  const activeSubmodule = getCurrentSubmodule();

  const handleNavigate = (submoduleId) => {
    // Use onNavigate prop if provided (for backward compatibility)
    if (onNavigate) {
      onNavigate(submoduleId);
    } else {
      // Use React Router navigation
      const route = PROCESS_SUBMODULE_ROUTES[submoduleId];
      if (route) {
        navigate(route);
      }
    }
  };

  return (
    <div className="submodule-nav">
      <span className="submodule-nav-label">Switch:</span>
      {PROCESS_SUBMODULES.map(sub => (
        <button
          key={sub.id}
          className={`submodule-nav-btn ${activeSubmodule === sub.id ? 'active' : ''}`}
          onClick={() => handleNavigate(sub.id)}
          title={sub.label}
        >
          <span className="submodule-nav-icon">{sub.icon}</span>
          <span>{sub.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ProcessSubmoduleNav;

