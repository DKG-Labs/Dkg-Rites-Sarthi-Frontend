import React, { useEffect, useState } from 'react';

export const DEFAULT_CASTING_WINDOW_DAYS = 60;

const toIso = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

// Default window: the last 60 days up to today (same as the data that was shown before the filter existed)
export const getDefaultCastingRange = () => {
    const from = new Date();
    from.setDate(from.getDate() - DEFAULT_CASTING_WINDOW_DAYS);
    return { fromDate: toIso(from), toDate: '' };
};

// Normalises dd/MM/yyyy or yyyy-MM-dd (optionally with a time part) to yyyy-MM-dd; '' when not a date
export const toIsoDate = (value) => {
    if (!value) return '';
    const s = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    return '';
};

// True when the casting date falls inside the range; rows with an unreadable date are kept
export const inCastingRange = (castingDate, range) => {
    const iso = toIsoDate(castingDate);
    if (!iso) return true;
    if (range?.fromDate && iso < range.fromDate) return false;
    if (range?.toDate && iso > range.toDate) return false;
    return true;
};

// A date typed half-way (e.g. year 0002) is not a usable date
const isUsable = (iso) => !iso || (/^\d{4}-\d{2}-\d{2}$/.test(iso) && iso >= '2000-01-01');

// The dates are edited as a draft and only sent to the server (onChange) when Apply is pressed
const CastingDateRangeFilter = ({ range, onChange, disabled }) => {
    const [draft, setDraft] = useState(range);

    useEffect(() => {
        setDraft(range);
    }, [range]);

    const wrongOrder = draft.fromDate && draft.toDate && draft.fromDate > draft.toDate;
    const unusable = !isUsable(draft.fromDate) || !isUsable(draft.toDate);
    const unchanged = draft.fromDate === range.fromDate && draft.toDate === range.toDate;
    const canApply = !disabled && !wrongOrder && !unusable && !unchanged;

    const btn = {
        padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '8px',
        fontSize: '12px', fontWeight: '700', cursor: 'pointer'
    };
    const input = { padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px' };

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
            background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
            padding: '10px 14px', marginBottom: '16px'
        }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Date of Casting
            </span>
            <label style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                From
                <input
                    type="date"
                    value={draft.fromDate}
                    min="2000-01-01"
                    max={draft.toDate || undefined}
                    onChange={(e) => setDraft({ ...draft, fromDate: e.target.value })}
                    style={input}
                />
            </label>
            <label style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                To
                <input
                    type="date"
                    value={draft.toDate}
                    min={draft.fromDate || '2000-01-01'}
                    onChange={(e) => setDraft({ ...draft, toDate: e.target.value })}
                    style={input}
                />
            </label>
            <button
                type="button"
                disabled={!canApply}
                onClick={() => onChange(draft)}
                style={{
                    ...btn,
                    background: canApply ? '#42818c' : '#e2e8f0',
                    color: canApply ? 'white' : '#94a3b8',
                    cursor: canApply ? 'pointer' : 'not-allowed'
                }}
            >
                Apply
            </button>
            <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(getDefaultCastingRange())}
                style={{ ...btn, background: '#f8fafc', color: '#475569' }}
            >
                Last {DEFAULT_CASTING_WINDOW_DAYS} days
            </button>
            {wrongOrder && <span style={{ fontSize: '11px', color: '#dc2626' }}>From date is after To date</span>}
            {!wrongOrder && unusable && <span style={{ fontSize: '11px', color: '#dc2626' }}>Enter a complete date (year 2000 or later)</span>}
        </div>
    );
};

export default CastingDateRangeFilter;
