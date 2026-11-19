# SARTHI Frontend Rules

Rules for every screen we build or change in SARTHI (RITES app, Sleeper-Dashboard, Railpad-IE, Vendor app).
When you touch a file, bring the part you touch up to these rules. Reviewers reject PRs that break them.

---

## 1. Visual design

### 1.1 Look and feel
- Clean, modern, light. White / very light grey surfaces, one accent colour, plenty of spacing.
- **No dark themes, dark headers or dark table bands.** Text is dark, backgrounds are light.
- **No purple, violet or pink gradients.** No "AI style" gradient cards, glow effects, glassmorphism or emoji icons in UI.
- No decoration that carries no information (random blobs, big hero banners on work screens).

### 1.2 Colour tokens (use these, do not invent new hex values)
| Use | Colour |
|---|---|
| Page background | `#f8fafc` |
| Card / surface | `#ffffff` |
| Border | `#e2e8f0` |
| Text primary | `#1e293b` |
| Text secondary | `#64748b` |
| Accent / primary action | `#2563eb` (hover `#1d4ed8`) |
| Focus ring | `0 0 0 3px rgba(59,130,246,0.12)` |
| Success | `#16a34a` on `#f0fdf4` |
| Warning | `#b45309` on `#fffbeb` |
| Danger | `#dc2626` on `#fef2f2` |

Status colours are only for status (badges, alerts). Never for decoration.

### 1.3 Typography and spacing
- Font sizes: 12 (meta), 13 (tables, inputs), 14 (body), 16 (section title), 20 (page title). Weights 400 / 500 / 600 only.
- Spacing on a 4px scale: 4, 8, 12, 16, 24, 32.
- Radius: 8 (inputs, small items), 10–12 (cards, menus). Shadows soft: `0 1px 2px rgba(15,23,42,0.04)`; menus `0 10px 30px rgba(15,23,42,0.10)`.

### 1.4 Controls
- **Dropdowns:** never show the raw browser `<select>` list. Use the shared `SelectMenu` (`Railpad-IE/src/components/common/SelectMenu.jsx`) or the app's existing styled select. Long lists (> 8 items: POs, vendors, ICs, plants) must have **search**.
- All inputs, selects and buttons in one row share the same height (40px) and are vertically aligned. No field wraps half under another.
- Every input has a visible label (placeholder is not a label). Required fields are marked.
- Buttons: one primary per area; secondary is outlined; destructive is red and asks for confirmation.
- Disable a button while its request runs and show a spinner on it. Never allow double submit.

### 1.5 Data must be real
- **No fake KPI cards, dummy numbers, sample rows or "lorem" text** in any build. If the API has no data, show an empty state.
- Only show a KPI/count card when the number comes from the backend and someone acts on it.
- Every number shows its unit (MT, Nos., Sets) and fixed decimals (qty in MT: 3 decimals).
- Dates shown as `DD/MM/YYYY` (with `HH:mm` when time matters), in IST.

### 1.6 States every screen must handle
| State | What to show |
|---|---|
| Loading | Skeleton rows / cards matching the final layout (not a blank page, not a full-screen spinner for a small section) |
| Empty | Short message + what the user can do next |
| Error | Plain message from the backend, a Retry button; never a raw stack trace or "undefined" |
| Success | Toast (auto-hides in ~3 s) |

### 1.7 Responsive and accessible
- Works at 375px (phone), 768px (tablet) and desktop. No horizontal page scroll; wide tables scroll inside their own container with a sticky first column where useful.
- Keyboard works: Tab order, Enter to submit, Escape closes modals and menus. Visible focus ring.
- Contrast at least 4.5:1 for text. Icons that act as buttons have `aria-label`.

---

## 2. API, security and config

### 2.1 Base URLs
- **No hard-coded URLs** (`http://localhost:8080`, Azure hostnames, IPs) in components or services.
- The base URL comes from env config only (`import.meta.env.VITE_*` / `process.env.REACT_APP_*`) through the app's `apiConfig` (`getBaseUrl()`).

### 2.2 Every API call goes through the shared client with the token
- **No API call without the auth token.** Use the shared axios instance / interceptor that adds `Authorization: Bearer <token>`. No raw `fetch`/`axios` with a hand-built header in a component.
- On 401: clear the session and send the user to login. On 403: show "not allowed", do not retry.
- Never put the token, passwords or keys in URLs, logs, `console.log`, or error messages.
- User id, role, vendor code come from the logged-in session/JWT on the backend — the frontend must not send them as trusted request params.

### 2.3 Where code lives
- API calls only in `services/` files. Components call services; they never build URLs.
- Shared UI in `components/common/`. Reuse before you create.
- No secrets in the frontend repo or `.env` committed to git.

---

## 3. Loading data the right way

### 3.1 Lazy loading
- **Route-level code splitting:** every page is `React.lazy(() => import('./pages/X'))` inside `<Suspense fallback={<PageSkeleton/>}>`.
- Heavy libraries (PDF, Excel export, charts, camera) are loaded with dynamic `import()` only when the user clicks the action.
- Modals and tabs load their data when opened, not when the parent page loads.
- Images: `loading="lazy"`, sized thumbnails in lists; full image only on click.

### 3.2 Lists and tables
- **Server-side pagination** for anything that can grow (calls, ICs, POs, history). Default page size 10–25. Never load "all rows" and filter in the browser.
- Search inputs are **debounced (300–400 ms)** and cancel the previous request (`AbortController`).
- Lists over ~200 visible rows use virtualisation.

### 3.3 Request hygiene
- Fire independent requests in parallel (`Promise.all`), not one after another.
- Cancel requests when the component unmounts or the filter changes (`AbortController`), and ignore stale responses.
- No API calls inside loops per row (N+1). Ask the backend for a bulk endpoint.
- Do not poll faster than every 30 s; stop polling when the tab is hidden.

### 3.4 Caching and expiry
| Data | Cache | Expiry (TTL) | Invalidate when |
|---|---|---|---|
| Masters (reasons, rail pad types, RIOs, roles, drawing nos.) | In-memory + `sessionStorage` | 12–24 h | Logout, app version change |
| User profile / mapped plants | In-memory | Session | Logout, role change |
| Dashboard counts | In-memory | 30–60 s | After any action on a call |
| Call lists / call details | In-memory | 30 s, refetch on focus | After create / modify / approve / reject |
| IC / certificate PDFs | Do not cache in browser storage | — | — |

- Use one cache helper (e.g. React Query / SWR, or a small `cachedGet(key, ttl, fn)` in `services/`) — not ad-hoc globals.
- Every cached entry stores `savedAt` and is ignored after its TTL. Cache keys include the user id so users never see each other's data.
- After a write (POST/PUT/DELETE), invalidate the related keys so the screen shows fresh data.
- Never cache tokens or personal data in `localStorage` beyond what login needs; clear everything on logout.
- Wrap all `localStorage` / `sessionStorage` reads/writes in `try/catch` (private mode can throw).

### 3.5 Performance budget
- First page interactive in < 3 s on a 4G phone. Initial JS bundle < 300 KB gzipped per app.
- No `console.log` in committed code. No unused libraries.
- Avoid re-renders: memoise derived lists (`useMemo`) and callbacks passed to big tables.

---

## 4. Forms
- Validate on the client for fast feedback **and** trust the backend's validation; show the backend message next to the field.
- Keep the user's input on error — never clear the form after a failed submit.
- Numbers: block negatives and text where not allowed; quantities rounded the same way the backend does.
- Confirm before leaving a form with unsaved changes.

---

## 5. Review checklist (paste in every PR)
- [ ] Light, modern look; no dark/purple, no gradients, no fake data or KPI cards
- [ ] Dropdowns styled (shared `SelectMenu`), searchable when long; controls aligned at 40px
- [ ] Loading skeleton, empty state, error with retry, success toast
- [ ] Works at 375px, keyboard and focus OK
- [ ] No hard-coded base URL; all calls via `services/` and the token interceptor
- [ ] Pagination / debounce / abort on lists; no per-row API calls
- [ ] Caching with TTL and invalidation after writes; nothing sensitive stored
- [ ] Pages and heavy libs lazy-loaded; no `console.log`
