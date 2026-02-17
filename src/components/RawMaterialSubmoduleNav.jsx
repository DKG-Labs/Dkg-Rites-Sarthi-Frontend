import { useNavigate, useLocation } from 'react-router-dom';
import { RAW_MATERIAL_SUBMODULE_ROUTES } from '../routes';
import './SubmoduleNav.css';

/**
 * Raw Material Submodule Navigation
 * Allows toggling between submodules without going back to dashboard
 * Uses React Router for URL-based navigation
 */

const RAW_MATERIAL_SUBMODULES = [
  { id: 'calibration-documents', label: 'Calibration & Documents', icon: '📄' },
  { id: 'visual-inspection', label: 'Visual Inspection', icon: '👁️' },
  { id: 'dimensional-check', label: 'Dimensional Check', icon: '📐' },
  { id: 'material-testing', label: 'Material Testing', icon: '🧪' },
  { id: 'packing-storage', label: 'Packing & Storage', icon: '📦' },
  { id: 'summary-reports', label: 'Summary and Reports', icon: '📊' },
];

const RawMaterialSubmoduleNav = ({ currentSubmodule, onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current submodule from URL if not provided
  const getCurrentSubmodule = () => {
    if (currentSubmodule) return currentSubmodule;
    const path = location.pathname;
    for (const [id, route] of Object.entries(RAW_MATERIAL_SUBMODULE_ROUTES)) {
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
      const route = RAW_MATERIAL_SUBMODULE_ROUTES[submoduleId];
      if (route) {
        navigate(route);
      }
    }
  };

  return (
    <div className="submodule-nav">
      <span className="submodule-nav-label">Switch:</span>
      {RAW_MATERIAL_SUBMODULES.map(sub => (
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

export default RawMaterialSubmoduleNav;

