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
