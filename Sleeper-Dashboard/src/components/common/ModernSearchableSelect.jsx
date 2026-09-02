import React, { useState, useEffect, useRef } from 'react';

/**
 * ModernSearchableSelect Component
 * A sleek, searchable, and scrollable dropdown selector.
 */
const ModernSearchableSelect = ({
    value,
    onChange,
    options = [],
    placeholder = 'Select...',
    disabled = false,
    theme = 'blue' // 'blue' or 'red'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const wrapperRef = useRef(null);
    const searchInputRef = useRef(null);

    // Normalize options format ({ value, label })
    const normalizedOptions = options.map(opt => {
        if (typeof opt === 'object' && opt !== null) {
            return { value: opt.value, label: opt.label || opt.value };
        }
        return { value: opt, label: String(opt) };
    });

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter options based on search query
    const filteredOptions = normalizedOptions.filter(opt =>
        String(opt.label).toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(opt.value).toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedOption = normalizedOptions.find(o => String(o.value) === String(value));

    const handleToggle = () => {
        if (disabled) return;
        const nextState = !isOpen;
        setIsOpen(nextState);
        setSearchQuery('');
        if (nextState) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        }
    };

    const handleSelect = (optValue) => {
        onChange(optValue);
        setIsOpen(false);
        setSearchQuery('');
    };

    const primaryColor = theme === 'red' ? '#e11d48' : '#2563eb';
    const activeBorderColor = theme === 'red' ? '#f43f5e' : '#3b82f6';
    const activeRingColor = theme === 'red' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(37, 99, 235, 0.15)';

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%', zIndex: isOpen ? 9999 : 1 }}>
            {/* Trigger Button */}
            <div
                onClick={handleToggle}
                style={{
                    height: '42px',
                    borderRadius: '8px',
                    border: `1.5px solid ${isOpen ? activeBorderColor : '#cbd5e1'}`,
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: disabled ? '#f8fafc' : '#ffffff',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    boxShadow: isOpen ? `0 0 0 3px ${activeRingColor}` : 'none',
                    transition: 'all 0.2s',
                    userSelect: 'none'
                }}
            >
                <span style={{
                    fontSize: '13px',
                    fontWeight: value ? '700' : '500',
                    color: disabled ? '#94a3b8' : (value ? '#0f172a' : '#94a3b8'),
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>

                <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: disabled ? '#cbd5e1' : '#64748b',
                    fontSize: '12px'
                }}>
                    {value && !disabled && (
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange('');
                            }}
                            title="Clear"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                background: '#f1f5f9',
                                color: '#64748b',
                                fontSize: '11px',
                                fontWeight: '800',
                                marginRight: '2px'
                            }}
                        >
                            ✕
                        </span>
                    )}
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        style={{
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                        }}
                    >
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </span>
            </div>

            {/* Floating Searchable Menu */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    boxShadow: '0 20px 30px -4px rgba(15, 23, 42, 0.25), 0 8px 12px -4px rgba(15, 23, 42, 0.15)',
                    zIndex: 99999,
                    overflow: 'hidden'
                }}>
                    {/* Search Input Bar */}
                    <div style={{
                        padding: '8px 10px',
                        borderBottom: '1px solid #f1f5f9',
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>🔍</span>
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Type to search..."
                            style={{
                                width: '100%',
                                border: 'none',
                                background: 'transparent',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#0f172a',
                                outline: 'none'
                            }}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    padding: '0 4px'
                                }}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Scrollable Options List */}
                    <div style={{
                        maxHeight: '190px',
                        overflowY: 'auto',
                        padding: '4px 0'
                    }}>
                        {filteredOptions.length === 0 ? (
                            <div style={{
                                padding: '16px',
                                textAlign: 'center',
                                color: '#94a3b8',
                                fontSize: '12px',
                                fontWeight: '600'
                            }}>
                                No matches found
                            </div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isSelected = String(opt.value) === String(value);
                                return (
                                    <div
                                        key={opt.value}
                                        onClick={() => handleSelect(opt.value)}
                                        style={{
                                            padding: '8px 14px',
                                            fontSize: '13px',
                                            fontWeight: isSelected ? '700' : '500',
                                            color: isSelected ? primaryColor : '#334155',
                                            backgroundColor: isSelected ? (theme === 'red' ? '#fff1f2' : '#eff6ff') : 'transparent',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            transition: 'background 0.15s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                    >
                                        <span>{opt.label}</span>
                                        {isSelected && (
                                            <span style={{ color: primaryColor, fontWeight: '800', fontSize: '12px' }}>
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer Info */}
                    <div style={{
                        padding: '5px 12px',
                        borderTop: '1px solid #f1f5f9',
                        background: '#fafafa',
                        fontSize: '10px',
                        color: '#94a3b8',
                        fontWeight: '600',
                        display: 'flex',
                        justifyContent: 'space-between'
                    }}>
                        <span>{filteredOptions.length} available</span>
                        {searchQuery && <span>Filtered</span>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModernSearchableSelect;
