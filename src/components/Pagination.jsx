import React, { useEffect, useRef, useState } from "react";
import "./Pagination.css";

const ROW_OPTIONS = [5, 10, 15, 20];

/* Custom rows-per-page dropdown (native <select> list can't be styled) */
export const RowsSelect = ({ value, onChange, options = ROW_OPTIONS }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (v) => { setOpen(false); if (v !== value) onChange(v); };

  return (
    <div className={`pg-select ${open ? "is-open" : ""}`} ref={ref}>
      <button
        type="button"
        className="pg-select-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{value}</span>
        <svg className="pg-select-chev" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul className="pg-select-menu" role="listbox">
          {options.map((opt) => (
            <li
              key={opt}
              role="option"
              aria-selected={opt === value}
              tabIndex={0}
              className={`pg-select-opt ${opt === value ? "is-active" : ""}`}
              onClick={() => pick(opt)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(opt); } }}
            >
              <span>{opt}</span>
              {opt === value && (
                <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
                  <path d="M5 12l5 5 9-10" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Pagination = ({
  currentPage,
  totalPages,
  start,
  end,
  totalCount,
  onPageChange,
  rows,
  onRowsChange,
  theme = 'teal', // teal, blue, orange, slate
  showRows = true
}) => {
  return (
    <div className={`pg-wrapper pg-theme-${theme}`}>

      {/* LEFT: Count */}
      <div className="pg-count">
        {start + 1}–{end} of {totalCount}
      </div>

      {/* MIDDLE: Rows Selector */}
      {showRows && (
        <div className="pg-rows">
          Rows:
          <RowsSelect value={Number(rows)} onChange={(v) => onRowsChange(Number(v))} />
        </div>
      )}

      {/* RIGHT: Pagination Buttons */}
      <div className="pg-buttons">
        <button
          className="pg-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
        >
          ‹ Prev
        </button>

        <button
          className="pg-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
        >
          Next ›
        </button>
      </div>

    </div>
  );
};

export default Pagination;
