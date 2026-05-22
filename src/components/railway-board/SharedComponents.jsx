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

export const ExportButton = ({ onClick, label = "Export Excel", disabled = false }) => (
    <button
        className={`btn-export-excel ${disabled ? 'disabled' : ''}`}
        onClick={disabled ? null : onClick}
        disabled={disabled}
        title={disabled ? "Processing..." : "Download Excel Report"}
    >
        {disabled ? (
            <div className="spinner-small"></div>
        ) : (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3V16M12 16L7 11M12 16L17 11M5 21H19" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )}
        <span>{label}</span>
    </button>
);

export const downloadExcel = (data, headers, filename) => {
    if (!data || data.length === 0) {
        alert("No data available to export.");
        return;
    }

    const headerRow = headers.map(h => h.label).join(',');

    const dataRows = data.map(row => {
        return headers.map(header => {
            let cellValue = row[header.key];

            if (cellValue === null || cellValue === undefined) {
                cellValue = '';
            }

            const stringValue = String(cellValue);

            if (/^\d+$/.test(stringValue) && (stringValue.length > 10 || stringValue.startsWith('0'))) {
                return `="${stringValue}"`;
            }

            const escaped = stringValue.replace(/"/g, '""');
            return escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')
                ? `"${escaped}"`
                : escaped;
        }).join(',');
    });

    const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
