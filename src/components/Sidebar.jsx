import React, { useCallback } from 'react';
import SidebarNavItem from './SidebarNavItem';

const Sidebar = React.memo(({
  currentPage,
  activeInspectionType,
  isSidebarOpen,
  isSidebarCollapsed,
  onCollapseToggle,
  onNav,
}) => {
  // Memoize nav item click handlers
  const handleLandingClick = useCallback(() => {
    onNav('landing');
  }, [onNav]);

  const handleRawMaterialClick = useCallback(() => {
    if (activeInspectionType === 'raw-material') onNav('raw-material');
  }, [activeInspectionType, onNav]);

  const handleProcessClick = useCallback(() => {
    if (activeInspectionType === 'process') onNav('process');
  }, [activeInspectionType, onNav]);

  const handleFinalProductClick = useCallback(() => {
    if (activeInspectionType === 'final-product') onNav('final-product');
  }, [activeInspectionType, onNav]);

  const handleAnnexuresClick = useCallback(() => {
    onNav('annexure');
  }, [onNav]);

  return (
    <aside className={`sidebar${isSidebarOpen ? ' open' : ''}${isSidebarCollapsed ? ' collapsed' : ''}`}>
      <button
        className="sidebar-toggle-btn"
        onClick={onCollapseToggle}
        aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isSidebarCollapsed ? '»' : '«'}
      </button>
      <nav>
        <ul className="sidebar-nav">
          <SidebarNavItem
            active={currentPage === 'landing'}
            onClick={handleLandingClick}
            icon="🏠"
            text="Landing Page"
            title="Landing Page"
          />
          {(activeInspectionType === 'raw-material' || activeInspectionType === null) && (
            <SidebarNavItem
              active={currentPage === 'raw-material'}
              onClick={handleRawMaterialClick}
              icon="📦"
              text="Raw Material Inspection"
              title="Raw Material Inspection"
              style={{ opacity: activeInspectionType === 'raw-material' ? 1 : 0.5, cursor: activeInspectionType === 'raw-material' ? 'pointer' : 'not-allowed' }}
            />
          )}
          {(activeInspectionType === 'process' || activeInspectionType === null) && (
            <SidebarNavItem
              active={currentPage === 'process'}
              onClick={handleProcessClick}
              icon="⚙️"
              text="Process Inspection"
              title="Process Inspection"
              style={{ opacity: activeInspectionType === 'process' ? 1 : 0.5, cursor: activeInspectionType === 'process' ? 'pointer' : 'not-allowed' }}
            />
          )}
          {(activeInspectionType === 'final-product' || activeInspectionType === null) && (
            <SidebarNavItem
              active={currentPage === 'final-product'}
              onClick={handleFinalProductClick}
              icon="✅"
              text="Final Product Inspection"
              title="Final Product Inspection"
              style={{ opacity: activeInspectionType === 'final-product' ? 1 : 0.5, cursor: activeInspectionType === 'final-product' ? 'pointer' : 'not-allowed' }}
            />
          )}
          <SidebarNavItem
            active={currentPage === 'annexure'}
            onClick={handleAnnexuresClick}
            icon="📋"
            text="Annexures"
            title="Annexures"
          />
        </ul>
      </nav>
    </aside>
  );
});

export default Sidebar;
