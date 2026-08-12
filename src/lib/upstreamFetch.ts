// H2 fix: every proxied call to the FPL API goes through here. The origin is
// a hardcoded constant — callers only ever supply a path, never a full URL —
// and we re-verify the constructed URL's origin before fetching, so no
// interpolated path segment (entry ID, league ID, etc.) can ever redirect
// the request to an attacker-controlled host.

const FPL_ORIGIN = 'https://fantasy.premierleague.com';
const DEFAULT_HEADERS = { 'User-Agent': 'Mozilla/5.0' };

/**
 * Validates that a path segment is a plain non-negative integer before it's
 * interpolated into an upstream URL. Throws on anything else (empty, signed,
 * decimal, containing slashes/query strings, etc).
 */
export function toSafeId(value: string | number | undefined | null, label = 'id'): string {
  const str = String(value ?? '');
  if (!/^\d+$/.test(str)) {
    throw new Error(`Invalid ${label}: must be a numeric ID`);
  }
  return str;
}

/**
 * Fetches from the FPL public API only. `path` must be a root-relative path
 * (e.g. `/api/entry/123/`) — it is always appended to the hardcoded FPL
 * origin, never treated as a full URL, so this function cannot be used to
 * reach any other host.
 */
export async function fplFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (!path.startsWith('/')) {
    throw new Error('fplFetch: path must be root-relative (start with "/")');
  }

  const url = `${FPL_ORIGIN}${path}`;

  // Defense-in-depth: re-parse and confirm the resolved origin still matches
  // the allowlist, in case future edits change how `url` is assembled.
  if (new URL(url).origin !== FPL_ORIGIN) {
    throw new Error('fplFetch: resolved URL origin is not on the allowlist');
  }

  return fetch(url, {
    ...init,
    headers: { ...DEFAULT_HEADERS, ...(init.headers || {}) },
  });
}
