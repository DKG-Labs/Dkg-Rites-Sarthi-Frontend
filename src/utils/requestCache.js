/**
 * Small in-memory request cache for read-heavy dashboard APIs.
 *
 * - Every key includes the logged-in user, so one user's data is never served to another
 *   user who logs in on the same tab.
 * - Entries expire after a TTL (default 5 minutes) so data does not go stale forever.
 * - In-flight requests are shared: two components asking for the same thing at once make one call.
 * - Failed requests are not cached.
 */

const DEFAULT_TTL_MS = 5 * 60 * 1000;
const store = new Map(); // key -> { value, expiresAt }
const inFlight = new Map(); // key -> Promise

/** Identifies the logged-in user; part of every cache key. */
export const currentUserKey = () => {
  try {
    return (
      localStorage.getItem('employeeCode') ||
      localStorage.getItem('userId') ||
      localStorage.getItem('username') ||
      'anon'
    );
  } catch {
    return 'anon';
  }
};

export const buildCacheKey = (name, params) =>
  `${currentUserKey()}|${name}|${JSON.stringify(params ?? null)}`;

export const getCachedValue = (key) => {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return hit.value;
};

export const setCachedValue = (key, value, ttlMs = DEFAULT_TTL_MS) => {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
};

/**
 * Returns the cached result for (name, params) or calls fetchFn(params) once and caches it.
 * Pass force=true to skip the cache (e.g. a Refresh button).
 */
export const cachedRequest = async (name, fetchFn, params, { ttlMs = DEFAULT_TTL_MS, force = false } = {}) => {
  const key = buildCacheKey(name, params);
  if (!force) {
    const cached = getCachedValue(key);
    if (cached !== undefined) return cached;
    if (inFlight.has(key)) return inFlight.get(key);
  }
  const promise = Promise.resolve()
    .then(() => fetchFn(params))
    .then((value) => {
      setCachedValue(key, value, ttlMs);
      return value;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
};

/** Clears everything (call on logout, or after a save that changes dashboard data). */
export const clearRequestCache = () => {
  store.clear();
  inFlight.clear();
};
