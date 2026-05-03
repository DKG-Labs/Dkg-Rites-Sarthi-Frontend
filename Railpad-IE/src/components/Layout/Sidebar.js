import React from 'react';

const Sidebar = ({ activeItem, onItemClick, isOpen, expanded, onMouseEnter, onMouseLeave, onClick, isShiftActive }) => {
    const menuSections = [
        {
            label: 'Modules',
            items: [
                { id: 'PortalHome', label: 'Portal Home', icon: 'PH' },
                { id: 'IE', label: 'RailPad IE', icon: 'IE' },
            ]
        }
    ];

    return (
        <aside
            className={`sidebar-root ${isOpen ? 'open' : ''} ${expanded ? 'expanded' : ''}`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
        >
            <div className="sidebar-header">
                <h2 className="sidebar-logo">SARTHI</h2>
                <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px', display: 'block' }}>Rites Ltd.</span>
            </div>

            <nav className="sidebar-nav">
                {menuSections.map((section, sidx) => (
                    <div key={sidx} className="menu-section">
                        <div className="menu-section-label">{section.label}</div>
                        {section.items.map((item) => {
                            const isLocked = item.id === 'IE' && !isShiftActive;
                            
                            return (
                                <div
                                    key={item.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isLocked) {
                                            onItemClick(item.id);
                                        }
                                    }}
                                    title={isLocked ? 'Please start duty from Portal Home to access this module' : ''}
                                    className={`menu-item ${activeItem === item.id ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '16px',
                                        opacity: isLocked ? 0.6 : 1,
                                        cursor: isLocked ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    <span className="menu-icon" style={{
                                        fontSize: '0.6rem',
                                        minWidth: '28px',
                                        height: '28px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: isLocked ? '#f1f5f9' : (activeItem === item.id ? '#338691' : '#f1f5f9'),
                                        color: isLocked ? '#94a3b8' : (activeItem === item.id ? 'white' : '#64748b'),
                                        borderRadius: '6px',
                                        fontWeight: '700',
                                        border: `1px solid ${activeItem === item.id && !isLocked ? '#338691' : '#e2e8f0'}`,
                                        position: 'relative'
                                    }}>
                                        {isLocked ? (
                                            <span style={{ fontSize: '10px' }}>🔒</span>
                                        ) : (
                                            item.icon
                                        )}
                                    </span>
                                    <span className="menu-label" style={{ 
                                        color: isLocked ? '#94a3b8' : (activeItem === item.id ? '#1e293b' : '#64748b') 
                                    }}>
                                        {item.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9', fontSize: 'var(--fs-xxs)', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                {expanded ? 'v1.2.0' : 'v1.2'}
            </div>
        </aside>
    );
};

export default Sidebar;
