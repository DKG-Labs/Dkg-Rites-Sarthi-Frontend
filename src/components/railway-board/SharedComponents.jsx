import React from 'react';

export const KPICard = ({ data, isActive, onClick }) => (
    <div
        className={`kpi-card ${isActive ? 'active' : ''} status-${data.status}`}
        onClick={onClick}
    >
        <div className="kpi-label">{data.label}</div>
        <div className="kpi-value">{data.value}</div>

    </div>
);

export const StatusBadge = ({ status }) => {
    let className = 'status-badge';
    if (status === 'Running' || status === 'Completed' || status === 'Accepted') className += ' status-running';
    else if (status.includes('Closed') || status === 'Rejected') className += ' status-closed';
    else if (status === 'Pending') className += ' status-warning';
    return <span className={className}>{status}</span>;
}

export const ExpandIcon = ({ isExpanded, isSubmenu = false }) => (
    <span className={`expand-icon ${isSubmenu ? 'submenu' : ''}`}>
        {isSubmenu
            ? (isExpanded ? '▾' : '▸')
            : (isExpanded ? '−' : '+')
        }
    </span>
);
