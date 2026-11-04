import React, { useEffect, useMemo, useRef, useState } from 'react';
import './SearchSelect.css';

/**
 * Modern searchable, scrollable dropdown.
 * Supports both single and multiple selection modes.
 *
 * options: string[] or { value, label }[]
 * When multiple=false:
 *   value: string
 *   onChange: (value: string) => void
 * When multiple=true:
 *   value: string[]
 *   onChange: (values: string[]) => void
 */
export default function SearchSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'All',
  disabled = false,
  multiple = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [hi, setHi] = useState(-1);
  const ref = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const items = useMemo(() => options.map(o => (typeof o === 'string' ? { value: o, label: o } : o)), [options]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter(o => o.label.toLowerCase().includes(q)) : items;
  }, [items, query]);

  // Selected values normalized for multi-select
  const selectedValues = useMemo(() => {
    if (!multiple) return [];
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
  }, [multiple, value]);

  const selectedItem = useMemo(() => {
    if (multiple) return null;
    return items.find(o => o.value === value);
  }, [multiple, items, value]);

  useEffect(() => {
    if (open) {
      setHi(-1);
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery('');
    }
  }, [open]);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-i="${hi}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [hi]);

  const pickSingle = (v) => {
    onChange(v);
    setOpen(false);
  };

  const toggleMulti = (v) => {
    const exists = selectedValues.includes(v);
    const next = exists ? selectedValues.filter(x => x !== v) : [...selectedValues, v];
    onChange(next);
  };

  const clearAll = () => {
    if (multiple) {
      onChange([]);
    } else {
      onChange('');
      setOpen(false);
    }
  };

  const selectAllFiltered = () => {
    if (!multiple) return;
    const next = Array.from(new Set([...selectedValues, ...filtered.map(o => o.value)]));
    onChange(next);
  };

  const onKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHi(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHi(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (hi === -1) {
        clearAll();
      } else if (filtered[hi]) {
        if (multiple) {
          toggleMulti(filtered[hi].value);
        } else {
          pickSingle(filtered[hi].value);
        }
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const mark = (text) => {
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

  // Determine display label and tooltip
  let displayLabel = placeholder;
  let tooltipText = '';
  const hasValue = multiple ? selectedValues.length > 0 : Boolean(value);

  if (multiple) {
    if (selectedValues.length === 0) {
      displayLabel = placeholder;
      tooltipText = placeholder;
    } else if (selectedValues.length === 1) {
      const it = items.find(o => o.value === selectedValues[0]);
      displayLabel = it?.label || selectedValues[0];
      tooltipText = displayLabel;
    } else {
      const it = items.find(o => o.value === selectedValues[0]);
      const first = it?.label || selectedValues[0];
      displayLabel = `${first} (+${selectedValues.length - 1} more)`;
      tooltipText = selectedValues.map(v => items.find(o => o.value === v)?.label || v).join(', ');
    }
  } else {
    displayLabel = selectedItem?.label || placeholder;
    tooltipText = displayLabel;
  }

  return (
    <div className={`sel-wrap ${disabled ? 'sel-disabled' : ''}`} ref={ref}>
      {label && <span className="sel-label">{label}</span>}
      <button
        type="button"
        className={`sel-trigger ${open ? 'sel-open' : ''} ${hasValue ? 'sel-has' : ''}`}
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        title={tooltipText}
      >
        <span className="sel-text">{displayLabel}</span>
        {multiple && selectedValues.length > 0 && (
          <span className="sel-badge" title={`${selectedValues.length} selected`}>
            {selectedValues.length}
          </span>
        )}
        {hasValue && !disabled && (
          <button
            type="button"
            className="sel-clear"
            aria-label="Clear selection"
            onClick={(e) => {
              e.stopPropagation();
              clearAll();
            }}
          >
            ✕
          </button>
        )}
        <svg className="sel-chev" viewBox="0 0 12 8" fill="none">
          <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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
              placeholder="Type to search…"
              onChange={e => { setQuery(e.target.value); setHi(0); }}
              onKeyDown={onKey}
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
                ✕
              </button>
            )}
          </div>

          {multiple && (
            <div className="sel-toolbar">
              <button type="button" className="sel-tool-btn" onClick={selectAllFiltered}>
                Select all {query ? `matching (${filtered.length})` : ''}
              </button>
              {selectedValues.length > 0 && (
                <button type="button" className="sel-tool-btn sel-tool-btn--clear" onClick={clearAll}>
                  Clear all ({selectedValues.length})
                </button>
              )}
            </div>
          )}

          <div className="sel-list" ref={listRef}>
            <button
              type="button"
              data-i={-1}
              className={`sel-opt sel-all ${!hasValue ? 'sel-selected' : ''} ${hi === -1 ? 'sel-hi' : ''}`}
              onMouseEnter={() => setHi(-1)}
              onClick={clearAll}
            >
              {multiple ? (
                <span className={`sel-cb ${!hasValue ? 'sel-cb--checked' : ''}`}>
                  {!hasValue ? '✓' : ''}
                </span>
              ) : null}
              <span className="sel-opt-text">{placeholder} <em>(show all)</em></span>
              {!multiple && !hasValue && <i className="sel-check">✓</i>}
            </button>

            {filtered.length === 0 ? (
              <div className="sel-none">No matches for “{query}”</div>
            ) : (
              filtered.map((o, i) => {
                const isSelected = multiple ? selectedValues.includes(o.value) : value === o.value;
                return (
                  <button
                    type="button"
                    key={o.value}
                    data-i={i}
                    className={`sel-opt ${isSelected ? 'sel-selected' : ''} ${hi === i ? 'sel-hi' : ''}`}
                    onMouseEnter={() => setHi(i)}
                    onClick={() => (multiple ? toggleMulti(o.value) : pickSingle(o.value))}
                  >
                    {multiple && (
                      <span className={`sel-cb ${isSelected ? 'sel-cb--checked' : ''}`}>
                        {isSelected ? '✓' : ''}
                      </span>
                    )}
                    <span className="sel-opt-text">{mark(o.label)}</span>
                    {!multiple && isSelected && <i className="sel-check">✓</i>}
                  </button>
                );
              })
            )}
          </div>

          <div className="sel-foot">
            <span className="sel-foot-info">
              {multiple && selectedValues.length > 0 ? `${selectedValues.length} selected · ` : ''}
              {filtered.length} of {items.length}
            </span>
            {multiple && (
              <button type="button" className="sel-apply-btn" onClick={() => setOpen(false)}>
                Apply
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
