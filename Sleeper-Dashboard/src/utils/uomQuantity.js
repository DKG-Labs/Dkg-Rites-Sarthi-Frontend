import { QTY_UOM_RULES } from './constants.js';

/**
 * Helpers for UOM-driven manual quantity entry in Sleeper Final Inspection.
 * Rules (aliases, label, allowed decimals) come from QTY_UOM_RULES in constants.js.
 */

export const normalizeUom = (value) =>
    String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Returns the rule ({ key, label, wordsNoun, decimals, aliases }) of the first UOM candidate
 * that matches a configured alias, or null when none does. Candidates that match no rule
 * (e.g. a default 'Nos' placeholder) are skipped.
 */
export const getQtyUomRule = (...candidates) => {
    for (const candidate of candidates) {
        const uom = normalizeUom(candidate);
        if (!uom) continue;
        const key = Object.keys(QTY_UOM_RULES).find((k) =>
            (QTY_UOM_RULES[k].aliases || []).some((alias) => normalizeUom(alias) === uom)
        );
        if (key) return { key, ...QTY_UOM_RULES[key] };
    }
    return null;
};

export const roundQty = (value, decimals = 0) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    const factor = 10 ** Math.max(0, decimals);
    return Math.round(n * factor) / factor;
};

/** Leading numeric value of a number or a string such as "4524.36 RMT"; 0 when none. */
export const parseQty = (value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const n = parseFloat(String(value ?? '').replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
};

/** Accepted = Offered - Rejected, rounded to `decimals`, never negative. */
export const computeAcceptedQty = (offered, rejected, decimals = 0) =>
    Math.max(0, roundQty((Number(offered) || 0) - (Number(rejected) || 0), decimals));

/**
 * Validates a raw input string for a quantity field.
 * Returns null when the keystroke must be ignored, otherwise { text, value } where
 * `text` is what the input should show and `value` the numeric quantity (capped at max).
 */
export const sanitizeQtyInput = (raw, decimals = 0, max) => {
    const text = String(raw ?? '').trim();
    if (text === '') return { text: '', value: 0 };
    const pattern = decimals > 0 ? new RegExp(`^\\d*(\\.\\d{0,${decimals}})?$`) : /^\d*$/;
    if (!pattern.test(text)) return null;
    const value = parseFloat(text);
    if (!Number.isFinite(value)) return { text, value: 0 };
    const limit = Number(max);
    if (Number.isFinite(limit) && limit > 0 && value > limit) {
        return { text: String(limit), value: limit };
    }
    return { text, value };
};
