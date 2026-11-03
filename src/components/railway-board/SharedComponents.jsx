import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs/dist/exceljs.min.js';

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

export const downloadExcel = async (data, headers, filename, title) => {
    if (!data || data.length === 0) {
        alert("No data available to export.");
        return;
    }

    const displayTitle = title || filename.replace(/_/g, ' ');
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // Add Title Row
    const titleRow = worksheet.addRow([displayTitle]);
    titleRow.font = { bold: true, size: 14 };
    
    // Merge the title cells across the headers length
    if (headers.length > 1) {
        worksheet.mergeCells(1, 1, 1, headers.length);
    }
    
    // Add Empty Row
    worksheet.addRow([]);

    // Add Header Row
    const headerRow = worksheet.addRow(headers.map(h => h.label));
    headerRow.font = { bold: true };
    headerRow.eachCell(cell => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
        cell.border = {
            top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'}
        };
    });

    // Add Data Rows
    data.forEach(row => {
        const rowData = headers.map(header => {
            let val = row[header.key];
            return (val === null || val === undefined) ? '' : val;
        });
        worksheet.addRow(rowData);
    });

    // Auto-adjust column widths
    worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
            let columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) maxLength = columnLength;
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
    });

    // Save
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
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
    const [focusedIdx, setFocusedIdx] = React.useState(-1);
    const containerRef = React.useRef(null);
    const listRef = React.useRef(null);
    const searchRef = React.useRef(null);

    // Close on outside click
    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearch('');
                setFocusedIdx(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset focus index when search changes
    React.useEffect(() => { setFocusedIdx(-1); }, [search]);

    // Filter options based on search
    const filteredOptions = options.filter(opt =>
        (opt.label || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleOpen = () => {
        setIsOpen(!isOpen);
        setSearch('');
        setFocusedIdx(-1);
        if (!isOpen) {
            setTimeout(() => searchRef.current?.focus(), 50);
        }
    };

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
        setSearch('');
        setFocusedIdx(-1);
    };

    // Keyboard navigation
    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                setIsOpen(true);
                setTimeout(() => searchRef.current?.focus(), 50);
            }
            return;
        }
        if (e.key === 'Escape') {
            setIsOpen(false);
            setSearch('');
            setFocusedIdx(-1);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setFocusedIdx(i => Math.min(i + 1, filteredOptions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setFocusedIdx(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && focusedIdx >= 0 && filteredOptions[focusedIdx]) {
            e.preventDefault();
            handleSelect(filteredOptions[focusedIdx].value);
        }
    };

    // Scroll focused item into view
    React.useEffect(() => {
        if (focusedIdx >= 0 && listRef.current) {
            const items = listRef.current.querySelectorAll('.searchable-dropdown-option');
            if (items[focusedIdx]) {
                items[focusedIdx].scrollIntoView({ block: 'nearest' });
            }
        }
    }, [focusedIdx]);

    const generatedId = React.useId();
    const listboxId = `sd-listbox-${generatedId}`;
    const selectedOption = options.find(opt => opt.value === value);
    const displayLabel = selectedOption ? selectedOption.label : placeholder;
    const isPlaceholder = !selectedOption;

    return (
        <div ref={containerRef} className="searchable-dropdown-container" onKeyDown={handleKeyDown}>
            {/* Trigger */}
            <div
                onClick={handleOpen}
                className={`searchable-dropdown-trigger${isOpen ? ' open' : ''}`}
                tabIndex={0}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-controls={listboxId}
            >
                <span className={`searchable-dropdown-text${isPlaceholder ? ' placeholder' : ''}`}>
                    {displayLabel}
                </span>
                <span className="searchable-dropdown-icon">▼</span>
            </div>

            {/* Popover */}
            {isOpen && (
                <div id={listboxId} className="searchable-dropdown-popover" role="listbox">
                    {/* Search bar */}
                    <div className="searchable-dropdown-search-wrapper">
                        <span className="searchable-dropdown-search-icon">🔍</span>
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="searchable-dropdown-search-input"
                            autoFocus
                        />
                        {filteredOptions.length > 0 && (
                            <span className="searchable-dropdown-count">
                                {filteredOptions.length}
                            </span>
                        )}
                        {search && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setSearch(''); }}
                                className="searchable-dropdown-clear-btn"
                                tabIndex={-1}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Options list */}
                    <div className="searchable-dropdown-options-list" ref={listRef}>
                        {filteredOptions.length === 0 ? (
                            <div className="searchable-dropdown-no-results">
                                No matches for "{search}"
                            </div>
                        ) : (
                            filteredOptions.map((opt, i) => {
                                const isSelected = opt.value === value;
                                const isFocused = i === focusedIdx;
                                return (
                                    <div
                                        key={i}
                                        onClick={() => handleSelect(opt.value)}
                                        onMouseEnter={() => setFocusedIdx(i)}
                                        className={`searchable-dropdown-option${isSelected ? ' selected' : ''}${isFocused ? ' focused' : ''}`}
                                        role="option"
                                        aria-selected={isSelected}
                                    >
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
