import { useEffect, useId, useRef, useState } from 'react';

/**
 * Modern single-select dropdown (replaces the native <select> option list, which cannot be styled).
 * Keyboard: Enter/Space/ArrowDown opens, arrows move, Enter selects, Escape closes.
 *
 * <SelectMenu value={v} onChange={setV} options={[{ value: 'ALL', label: 'All Call Types' }]} />
 */
export default function SelectMenu({ value, onChange, options = [], ariaLabel, minWidth = 180, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const openMenu = () => {
    if (disabled) return;
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };
  const pick = (opt) => { onChange?.(opt.value); setOpen(false); };

  const onKeyDown = (e) => {
    if (!open) {
      if (['Enter', ' ', 'ArrowDown'].includes(e.key)) { e.preventDefault(); openMenu(); }
      return;
    }
    if (e.key === 'Escape') { setOpen(false); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(options.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (options[active]) pick(options[active]); }
  };

  return (
    <div ref={rootRef} style={{ position: 'relative', minWidth, flex: '0 0 auto' }}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        style={{
          width: '100%', height: 40, padding: '0 12px 0 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          borderRadius: 10, border: `1px solid ${open ? '#3b82f6' : '#e2e8f0'}`,
          background: '#ffffff', color: '#1e293b', fontSize: 13, fontWeight: 500,
          cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
          boxShadow: open ? '0 0 0 3px rgba(59,130,246,0.12)' : '0 1px 2px rgba(15,23,42,0.04)',
          transition: 'border-color .15s, box-shadow .15s',
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected?.label}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
            margin: 0, padding: 6, listStyle: 'none',
            background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12,
            boxShadow: '0 10px 30px rgba(15,23,42,0.10), 0 2px 6px rgba(15,23,42,0.06)',
            maxHeight: 280, overflowY: 'auto',
          }}
        >
          {options.map((opt, i) => {
            const isSel = opt.value === selected?.value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSel}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => { e.preventDefault(); pick(opt); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  padding: '9px 10px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                  color: isSel ? '#1d4ed8' : '#1e293b', fontWeight: isSel ? 600 : 500,
                  background: i === active ? '#f1f5f9' : 'transparent',
                }}
              >
                <span>{opt.label}</span>
                {isSel && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
