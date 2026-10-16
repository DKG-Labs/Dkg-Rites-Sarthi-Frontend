import React, { useState, useEffect, useRef } from 'react';

const OPTIONS = [
  {
    value: 'T-55-2025',
    title: 'T-55-2025',
    badge: 'Standard',
    badgeBg: '#ecfdf5',
    badgeColor: '#047857',
    badgeBorder: '#a7f3d0',
    subtitle: 'All tests applicable',
    dotColor: '#10b981'
  },
  {
    value: 'T-55-2023',
    title: 'T-55-2023',
    badge: '5 Tests N/A',
    badgeBg: '#fffbeb',
    badgeColor: '#b45309',
    badgeBorder: '#fde68a',
    subtitle: '5 Tests N/A • H-Pull Mandatory',
    dotColor: '#f59e0b'
  }
];

const SpecificVersionDropdown = ({ value = 'T-55-2025', onChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = OPTIONS.find(opt => opt.value === value) || OPTIONS[0];
  const is2023 = value === 'T-55-2023';

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val) => {
    if (disabled) return;
    setIsOpen(false);
    if (val !== value && onChange) {
      onChange(val);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        userSelect: 'none'
      }}
    >
      {/* Structured Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: '38px',
          padding: '0 12px',
          background: is2023 ? '#fffdf7' : '#ffffff',
          border: isOpen
            ? '1.5px solid #21808d'
            : is2023
              ? '1.5px solid #f59e0b'
              : '1.5px solid #cbd5e1',
          borderRadius: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          boxShadow: isOpen
            ? '0 0 0 3px rgba(33, 128, 141, 0.12)'
            : '0 1px 2px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.18s ease'
        }}
        onMouseEnter={(e) => {
          if (!disabled && !isOpen) {
            e.currentTarget.style.borderColor = is2023 ? '#d97706' : '#94a3b8';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !isOpen) {
            e.currentTarget.style.borderColor = is2023 ? '#f59e0b' : '#cbd5e1';
          }
        }}
      >
        {/* Left Section: Dot + Version Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: selectedOption.dotColor,
              flexShrink: 0,
              boxShadow: `0 0 0 2px ${selectedOption.badgeBg}`
            }}
          />
          <span
            style={{
              fontSize: '14.5px',
              fontWeight: '800',
              color: is2023 ? '#92400e' : '#0f172a',
              letterSpacing: '-0.2px',
              whiteSpace: 'nowrap'
            }}
          >
            {selectedOption.title}
          </span>
        </div>

        {/* Right Section: Badge + Chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: '700',
              padding: '2px 6px',
              borderRadius: '4px',
              background: selectedOption.badgeBg,
              color: selectedOption.badgeColor,
              border: `1px solid ${selectedOption.badgeBorder}`,
              letterSpacing: '0.2px',
              whiteSpace: 'nowrap'
            }}
          >
            {selectedOption.badge}
          </span>

          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              color: isOpen ? '#21808d' : '#64748b',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease, color 0.15s ease'
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Uniform Floating Popover Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            left: 0,
            right: 0,
            minWidth: '240px',
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 12px 24px -4px rgba(15, 23, 42, 0.12), 0 4px 6px -2px rgba(15, 23, 42, 0.04)',
            padding: '4px',
            zIndex: 9999,
            animation: 'fadeInDown 0.15s ease-out'
          }}
        >
          {OPTIONS.map((opt, idx) => {
            const isSelected = opt.value === value;
            return (
              <React.Fragment key={opt.value}>
                {idx > 0 && (
                  <div style={{ height: '1px', background: '#f1f5f9', margin: '3px 0' }} />
                )}
                <div
                  onClick={() => handleSelect(opt.value)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '7px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    background: isSelected ? 'rgba(33, 128, 141, 0.06)' : 'transparent',
                    border: isSelected ? '1px solid rgba(33, 128, 141, 0.2)' : '1px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = '#f8fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {/* Left: Dot + Title & Subtitle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: opt.dotColor,
                        flexShrink: 0
                      }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '13.5px',
                            fontWeight: '800',
                            color: isSelected ? '#0f172a' : '#334155',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {opt.title}
                        </span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: '700',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: opt.badgeBg,
                            color: opt.badgeColor,
                            border: `1px solid ${opt.badgeBorder}`,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {opt.badge}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#64748b',
                          marginTop: '1px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {opt.subtitle}
                      </span>
                    </div>
                  </div>

                  {/* Right: Symmetrical Checkmark Column */}
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {isSelected && (
                      <span
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: '#21808d',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: '800'
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SpecificVersionDropdown;
