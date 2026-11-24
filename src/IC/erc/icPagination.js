/*
 * ERC RM / Process IC pagination.
 * More than MAX_PER_PAGE heat nos. (RM) or lot nos. (Process) → the IC is printed on several pages,
 * each a full copy of the IC with only its share of the heats / lots.
 * Pages = ceil(n / 5), shared evenly: 6 → 3+3, 7 → 4+3, 11 → 4+4+3. Up to 5 → one page, as before.
 */

export const MAX_PER_PAGE = 5;

/** Splits items into balanced pages of at most `max`. Always returns at least one page. */
export const splitBalanced = (items, max = MAX_PER_PAGE) => {
  const list = Array.isArray(items) ? items : [];
  if (list.length <= max) return [list];
  const pages = Math.ceil(list.length / max);
  const base = Math.floor(list.length / pages);
  let extra = list.length % pages;              // the first `extra` pages get one more
  const out = [];
  let i = 0;
  for (let p = 0; p < pages; p++) {
    const size = base + (extra > 0 ? 1 : 0);
    if (extra > 0) extra--;
    out.push(list.slice(i, i + size));
    i += size;
  }
  return out;
};

const NB = ' ';           // non-breaking space
const NBH = '‑';          // non-breaking hyphen

/**
 * RM IC "Qty. for which stage is cleared" text, one entry per page.
 * Each page: its heat lines + the overall Total Qty and NOs (Approx.) (same total on every page).
 * With 5 or fewer heats a single page is returned in exactly the old format.
 *
 * @param heatDetails  [{ heatNo, status, weightAcceptedMt }]
 * @param nosFromMt    (totalMt) => approx. number of ERCs (0 = do not show)
 */
export const buildRmClearedQtyPages = (heatDetails, nosFromMt) => {
  const heats = Array.isArray(heatDetails) ? heatDetails : [];
  const line = (h) => {
    const accepted = h.status === 'ACCEPTED' || h.status === 'PARTIALLY_ACCEPTED';
    const mt = accepted ? parseFloat(h.weightAcceptedMt || 0) : 0;
    return { mt, text: accepted ? `${h.heatNo}${NB}${NBH}${NB}${mt.toFixed(3)}MT` : `${h.heatNo}${NB}${NBH}${NB}Nill` };
  };
  const lines = heats.map(line);
  const totalMt = lines.reduce((s, l) => s + l.mt, 0);
  const nos = totalMt > 0 && nosFromMt ? nosFromMt(totalMt) : 0;
  const overall = totalMt > 0
    ? [`Total${NB}Qty${NB}${NBH}${NB}${totalMt.toFixed(3)}MT`, ...(nos > 0 ? [`${nos}${NB}NOs${NB}(Approx.)`] : [])]
    : [`Total${NB}Qty${NB}${NBH}${NB}Nill`];

  const pages = splitBalanced(lines);
  if (pages.length === 1) {
    return [[...pages[0].map((l) => l.text), ...overall].join('\n')];
  }
  // every page: its heat lines + the overall Total Qty (and NOs), same on all pages
  return pages.map((pg) => [...pg.map((l) => l.text), ...overall].join('\n'));
};

/*
 * Pages that get the IE's digital signature on a split IC (same box position on each page).
 *   'all'   → "1,2,…,N"  (every page — the agreed behaviour)
 *   'last'  → "N"
 *   'first' → "1"        (old behaviour)
 * If the signing service rejects a page list during the UAT test, change SIGN_PAGES_MODE here only.
 * A one-page IC always signs page "1", exactly as before.
 */
export const SIGN_PAGES_MODE = 'all';

export const signPagesValue = (pageCount) => {
  const n = Math.max(1, Number(pageCount) || 1);
  if (n === 1) return '1';
  if (SIGN_PAGES_MODE === 'last') return String(n);
  if (SIGN_PAGES_MODE === 'first') return '1';
  return Array.from({ length: n }, (_, i) => i + 1).join(',');
};
