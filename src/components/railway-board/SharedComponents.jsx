import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export const ExportPdfButton = ({ onClick, label = "Export PDF", disabled = false }) => (
    <button
        className={`btn-export-excel ${disabled ? 'disabled' : ''}`}
        onClick={disabled ? null : onClick}
        disabled={disabled}
        title={disabled ? "Processing..." : "Download PDF Report"}
        style={{ background: '#dc2626', borderColor: '#b91c1c' }}
    >
        {disabled ? (
            <div className="spinner-small"></div>
        ) : (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15V3M12 15L8 11M12 15L16 11M2 17L2.621 19.485C2.72915 19.9177 2.97882 20.3018 3.33033 20.5763C3.68184 20.8508 4.11501 20.9999 4.561 21H19.439C19.885 20.9999 20.3182 20.8508 20.6697 20.5763C21.0212 20.3018 21.2708 19.9177 21.379 19.485L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

export const downloadPdf = (data, headers, filename, title) => {
    if (!data || data.length === 0) {
        alert("No data available to export.");
        return;
    }

    const doc = new jsPDF('landscape');
    
    // Add title
    doc.setFontSize(14);
    doc.text(title || filename, 14, 15);
    
    const tableColumn = headers.map(h => h.label);
    const tableRows = [];

    data.forEach(row => {
        const rowData = headers.map(header => {
            let cellValue = row[header.key];
            if (cellValue === null || cellValue === undefined) {
                return '';
            }
            return String(cellValue);
        });
        tableRows.push(rowData);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [4, 120, 87] }
    });

    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};


export const SearchableDropdown = ({ value, onChange, options, placeholder = "Select option..." }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const containerRef = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter options based on search input
    const filteredOptions = options.filter(opt => 
        (opt.label || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
        setSearch('');
    };

    // Find active option label
    const selectedOption = options.find(opt => opt.value === value);
    const displayLabel = selectedOption ? selectedOption.label : value || placeholder;

    return (
        <div ref={containerRef} className="searchable-dropdown-container">
            {/* Display Box */}
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`searchable-dropdown-trigger ${isOpen ? 'open' : ''}`}
            >
                <span className={`searchable-dropdown-text ${!selectedOption ? 'placeholder' : ''}`}>
                    {displayLabel}
                </span>
                <span className="searchable-dropdown-icon">
                    ▼
                </span>
            </div>

            {/* Dropdown Popover */}
            {isOpen && (
                <div className="searchable-dropdown-popover">
                    {/* Search Field */}
                    <div className="searchable-dropdown-search-wrapper">
                        <span className="searchable-dropdown-search-icon">🔍</span>
                        <input 
                            type="text"
                            placeholder="Type to search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="searchable-dropdown-search-input"
                            autoFocus
                        />
                        {search && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setSearch(''); }}
                                className="searchable-dropdown-clear-btn"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Options List */}
                    <div className="searchable-dropdown-options-list">
                        {filteredOptions.length === 0 ? (
                            <div className="searchable-dropdown-no-results">
                                No matches found
                            </div>
                        ) : (
                            filteredOptions.map((opt, i) => {
                                const isSelected = opt.value === value;
                                return (
                                    <div 
                                        key={i}
                                        onClick={() => handleSelect(opt.value)}
                                        className={`searchable-dropdown-option ${isSelected ? 'selected' : ''}`}
                                    >
                                        <span style={{
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '90%'
                                        }}>
                                            {opt.label}
                                        </span>
                                        {isSelected && (
                                            <span className="searchable-dropdown-option-check">✓</span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
