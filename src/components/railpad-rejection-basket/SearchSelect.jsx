import React, { useEffect, useMemo, useRef, useState } from 'react';
import './SearchSelect.css';

/**
 * Modern searchable, floating dropdown component (matches ERC & Railway Board style).
 * Replaces native browser <select> controls with floating search popup.
 */
export default function SearchSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  disabled = false,
  allowAll = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [hi, setHi] = useState(-1);
  const ref = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const items = useMemo(() => {
    return options.map(o => (typeof o === 'string' ? { value: o, label: o } : o));
  }, [options]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter(o => o.label.toLowerCase().includes(q)) : items;
  }, [items, query]);

  const selectedItem = useMemo(() => {
    return items.find(o => o.value === value);
  }, [items, value]);

  useEffect(() => {
    if (open) {
      setHi(-1);
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery('');
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-i="${hi}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [hi]);

  const pickSingle = (v) => {
    onChange(v);
    setOpen(false);
  };

  const clearSelection = () => {
    onChange('');
    setOpen(false);
  };

  const onKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHi(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHi(i => Math.max(i - 1, allowAll ? -1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (hi === -1 && allowAll) {
        clearSelection();
      } else if (filtered[hi]) {
        pickSingle(filtered[hi].value);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const markMatch = (text) => {
    const q = query.trim();
    if (!q) return text;
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return text;
    return (
      <>
        {text.slice(0, i)}
        <mark>{text.slice(i, i + q.length)}</mark>
        {text.slice(i + q.length)}
      </>
    );
  };

  const displayLabel = selectedItem?.label || placeholder;
  const hasValue = Boolean(value);

  return (
    <div className={`sel-wrap ${disabled ? 'sel-disabled' : ''}`} ref={ref}>
      {label && <span className="sel-label">{label}</span>}
      <button
        type="button"
        className={`sel-trigger ${open ? 'sel-open' : ''} ${hasValue ? 'sel-has' : ''}`}
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        title={displayLabel}
      >
        <span className="sel-text">{displayLabel}</span>
        {allowAll && hasValue && !disabled && (
          <button
            type="button"
            className="sel-clear"
            aria-label="Clear selection"
            onClick={(e) => {
              e.stopPropagation();
              clearSelection();
            }}
          >
            ✕
          </button>
        )}
        <svg className="sel-chev" viewBox="0 0 12 8" fill="none">
          <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="sel-pop">
          <div className="sel-search">
            <svg viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              placeholder="Search plant or product…"
              onChange={e => {
                setQuery(e.target.value);
                setHi(0);
              }}
              onKeyDown={onKey}
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
                ✕
              </button>
            )}
          </div>

          <div className="sel-list" ref={listRef}>
            {allowAll && (
              <button
                type="button"
                data-i={-1}
                className={`sel-opt sel-all ${!hasValue ? 'sel-selected' : ''} ${hi === -1 ? 'sel-hi' : ''}`}
                onMouseEnter={() => setHi(-1)}
                onClick={clearSelection}
              >
                <span className="sel-opt-text">{placeholder} <em>(show all)</em></span>
                {!hasValue && <i className="sel-check">✓</i>}
              </button>
            )}

            {filtered.length === 0 ? (
              <div className="sel-none">No matches found for “{query}”</div>
            ) : (
              filtered.map((o, i) => {
                const isSelected = value === o.value;
                return (
                  <button
                    type="button"
                    key={o.value}
                    data-i={i}
                    className={`sel-opt ${isSelected ? 'sel-selected' : ''} ${hi === i ? 'sel-hi' : ''}`}
                    onMouseEnter={() => setHi(i)}
                    onClick={() => pickSingle(o.value)}
                  >
                    <span className="sel-opt-text">{markMatch(o.label)}</span>
                    {isSelected && <i className="sel-check">✓</i>}
                  </button>
                );
              })
            )}
          </div>

          <div className="sel-foot">
            {filtered.length} of {items.length} {items.length === 1 ? 'option' : 'options'}
          </div>
        </div>
      )}
    </div>
  );
}

