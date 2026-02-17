import { useNavigate, useLocation } from 'react-router-dom';
import { FINAL_PRODUCT_SUBMODULE_ROUTES } from '../routes';
import './FinalSubmoduleNav.css';

/**
 * Final Product Submodule Navigation
 * Allows toggling between submodules without going back to dashboard
 * Uses React Router for URL-based navigation
 */

const FINAL_SUBMODULES = [
  { id: 'final-calibration-documents', label: 'Calibration', icon: '📋' },
  { id: 'final-visual-dimensional', label: 'Visual', icon: '👁️' },
  { id: 'final-chemical-analysis', label: 'Chemical', icon: '🧪' },
  { id: 'final-hardness-test', label: 'Hardness', icon: '💎' },
  { id: 'final-inclusion-rating', label: 'Inclusion', icon: '🔬' },
  { id: 'final-application-deflection', label: 'Dim & Defl', icon: '📏' },
  { id: 'final-weight-test', label: 'Weight', icon: '⚖️' },
  { id: 'final-toe-load-test', label: 'Toe Load', icon: '🦶' },
  { id: 'final-reports', label: 'Reports', icon: '📊' },
];

const FinalSubmoduleNav = ({ currentSubmodule, onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current submodule from URL if not provided
  const getCurrentSubmodule = () => {
    if (currentSubmodule) return currentSubmodule;
    const path = location.pathname;
    for (const [id, route] of Object.entries(FINAL_PRODUCT_SUBMODULE_ROUTES)) {
      if (path === route) return id;
    }
    return null;
  };

  const activeSubmodule = getCurrentSubmodule();

  const handleNavigate = (submoduleId) => {
    // Use onNavigate prop if provided (for backward compatibility)
    if (onNavigate && typeof onNavigate === 'function') {
      onNavigate(submoduleId);
    } else {
      // Use React Router navigation
      const route = FINAL_PRODUCT_SUBMODULE_ROUTES[submoduleId];
      if (route) {
        navigate(route);
      }
    }
  };

  return (
    <div className="submodule-nav">
      <span className="submodule-nav-label">Switch:</span>
      {FINAL_SUBMODULES.map(sub => (
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

export default FinalSubmoduleNav;

