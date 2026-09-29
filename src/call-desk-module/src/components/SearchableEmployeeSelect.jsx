import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const SearchableEmployeeSelect = ({
  options = [],
  value,
  onChange,
  valueKey,
  placeholder = '-- Select Employee --',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, showAbove: false });

  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options to { id, name, code, role }
  const normalizedOptions = options.map((opt) => {
    const optId = valueKey
      ? opt[valueKey]
      : (opt.userId ?? opt.id ?? opt.value ?? opt.employeeCode);
    return {
      id: optId,
      name: opt.fullName || opt.employeeName || opt.name || 'Unknown',
      code: opt.employeeCode || opt.empCode || opt.code || '',
      role: opt.role || opt.employeeRole || opt.roleName || '',
      original: opt,
    };
  });

  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.id) === String(value) || (opt.code && String(opt.code) === String(value))
  );

  const filteredOptions = normalizedOptions.filter((opt) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      opt.name.toLowerCase().includes(term) ||
      String(opt.code).toLowerCase().includes(term) ||
      opt.role.toLowerCase().includes(term)
    );
  });

  // Calculate position for fixed portal
  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownHeight = 310;
      const spaceBelow = window.innerHeight - rect.bottom;
      const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      setCoords({
        top: showAbove ? rect.top - 6 : rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        showAbove: showAbove,
      });
    }
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  // Recalculate position on scroll/resize when open
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        triggerRef.current && !triggerRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen]);

  const handleSelect = (option) => {
    onChange(option.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getInitials = (name) => {
    if (!name) return 'IE';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div style={{ position: 'relative', width: '100%', fontFamily: 'inherit' }}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: '10px',
          border: `1.5px solid ${isOpen ? '#0ea5e9' : '#cbd5e1'}`,
          backgroundColor: disabled ? '#f8fafc' : '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 3px rgba(14, 165, 233, 0.15)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '46px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', textAlign: 'left' }}>
          {selectedOption ? (
            <>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '700',
                  flexShrink: 0,
                  boxShadow: '0 2px 4px rgba(14, 165, 233, 0.25)',
                }}
              >
                {getInitials(selectedOption.name)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                  {selectedOption.name}
                </span>
                {selectedOption.code && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#0284c7',
                      backgroundColor: '#e0f2fe',
                      padding: '2px 7px',
                      borderRadius: '5px',
                      fontFamily: 'monospace',
                    }}
                  >
                    {selectedOption.code}
                  </span>
                )}
                {selectedOption.role && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '500',
                      color: '#64748b',
                    }}
                  >
                    • {selectedOption.role}
                  </span>
                )}
              </div>
            </>
          ) : (
            <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '400' }}>
              {placeholder}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', flexShrink: 0, marginLeft: '8px' }}>
          {selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setSearchTerm('');
              }}
              style={{
                fontSize: '14px',
                color: '#94a3b8',
                padding: '2px 4px',
                borderRadius: '4px',
                lineHeight: 1,
              }}
              title="Clear selection"
            >
              ✕
            </span>
          )}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              color: isOpen ? '#0ea5e9' : '#64748b',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Floating Dropdown via Portal - never gets clipped by modals or footers */}
      {isOpen &&
        coords.width > 0 &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: coords.showAbove ? 'auto' : `${coords.top}px`,
              bottom: coords.showAbove ? `${window.innerHeight - coords.top}px` : 'auto',
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1.5px solid #cbd5e1',
              boxShadow: '0 20px 45px -8px rgba(15, 23, 42, 0.3), 0 8px 16px -4px rgba(15, 23, 42, 0.15)',
              zIndex: 999999,
              overflow: 'hidden',
              animation: 'dropdownFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Search Box Header */}
            <div
              style={{
                padding: '10px 12px',
                borderBottom: '1px solid #f1f5f9',
                backgroundColor: '#f8fafc',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by Employee Name or Code..."
                  style={{
                    width: '100%',
                    padding: '8px 32px 8px 34px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#0ea5e9')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '2px 4px',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Options List */}
            <div
              style={{
                maxHeight: '220px',
                overflowY: 'auto',
                padding: '6px',
              }}
            >
              {filteredOptions.length === 0 ? (
                <div
                  style={{
                    padding: '20px 14px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontSize: '13px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>🔍 No employees found</span>
                  <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
                    Try searching with a different name or employee code
                  </span>
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected =
                    String(option.id) === String(value) ||
                    (option.code && String(option.code) === String(value));

                  return (
                    <div
                      key={option.id}
                      onClick={() => handleSelect(option)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                        borderLeft: isSelected ? '3px solid #0ea5e9' : '3px solid transparent',
                        marginBottom: '2px',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            backgroundColor: isSelected ? '#0ea5e9' : '#f1f5f9',
                            color: isSelected ? '#ffffff' : '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: '700',
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(option.name)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: '13px',
                                fontWeight: isSelected ? '700' : '600',
                                color: isSelected ? '#0284c7' : '#1e293b',
                              }}
                            >
                              {option.name}
                            </span>
                            {option.code && (
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  color: isSelected ? '#0369a1' : '#64748b',
                                  backgroundColor: isSelected ? '#bae6fd' : '#f1f5f9',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  fontFamily: 'monospace',
                                }}
                              >
                                {option.code}
                              </span>
                            )}
                          </div>
                          {option.role && (
                            <span
                              style={{
                                fontSize: '11px',
                                color: '#94a3b8',
                                marginTop: '2px',
                              }}
                            >
                              {option.role}
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <span
                          style={{
                            color: '#0ea5e9',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            marginLeft: '8px',
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer showing count */}
            <div
              style={{
                padding: '6px 12px',
                backgroundColor: '#f8fafc',
                borderTop: '1px solid #f1f5f9',
                fontSize: '11px',
                color: '#94a3b8',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>Total: {normalizedOptions.length} inspectors</span>
              {searchTerm && <span>Found: {filteredOptions.length}</span>}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default SearchableEmployeeSelect;
