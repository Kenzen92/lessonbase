/**
 * Centralized authentication token storage.
 *
 * This is the single source of truth for the auth token across the app. By
 * default the token is written to `localStorage`, which persists across browser
 * restarts so the user stays logged in after closing and reopening the browser.
 *
 * For shared/public devices a caller can opt out of persistence (the "Remember
 * me" pattern): the token is then kept in `sessionStorage` and is dropped as
 * soon as the browser is closed.
 *
 * Security notes (see also the security review in the PR description):
 *  - Web storage is readable by any JS running on the origin, so it is only as
 *    safe as the app is free of XSS. Keep output encoding/escaping strict.
 *  - The backend issues a long-lived DRF token; persisting it is acceptable for
 *    this app's threat model but the token should be invalidated server-side on
 *    logout (the app calls the logout endpoint) and ideally rotated/expired.
 */

const TOKEN_KEY = "token";
const USER_KEY = "user";
// Records whether the user opted into persistent login. Lives in localStorage
// so the preference itself survives a restart even when the token does not.
const PERSIST_KEY = "auth_persist";

const persistentStore = () => window.localStorage;
const sessionStore = () => window.sessionStorage;

/** Whether persistent login is enabled. Defaults to true. */
export const isPersistent = () => persistentStore().getItem(PERSIST_KEY) !== "false";

/**
 * Read the current auth token, regardless of which store it lives in.
 * Checks localStorage first (persistent) then sessionStorage (this-session-only).
 * @returns {string|null}
 */
export const getToken = () =>
  persistentStore().getItem(TOKEN_KEY) || sessionStore().getItem(TOKEN_KEY);

/**
 * Persist the auth token.
 * @param {string} token
 * @param {{ persist?: boolean }} [options] - persist=false keeps the token only
 *   for the current browser session (cleared on browser close).
 */
export const setToken = (token, { persist = true } = {}) => {
  persistentStore().setItem(PERSIST_KEY, persist ? "true" : "false");
  const target = persist ? persistentStore() : sessionStore();
  const other = persist ? sessionStore() : persistentStore();
  // Avoid a split-brain where both stores hold a (possibly stale) token.
  other.removeItem(TOKEN_KEY);
  target.setItem(TOKEN_KEY, token);
};

/** Remove the token from both stores. */
export const removeToken = () => {
  persistentStore().removeItem(TOKEN_KEY);
  sessionStore().removeItem(TOKEN_KEY);
};

/** Read the cached user object, if any. */
export const getUser = () => {
  const raw = persistentStore().getItem(USER_KEY) || sessionStore().getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/** Cache the user object alongside the token, honoring the persistence choice. */
export const setUser = (user) => {
  const target = isPersistent() ? persistentStore() : sessionStore();
  target.setItem(USER_KEY, JSON.stringify(user));
};

/** Clear all auth-related state from both stores (used on logout / 401). */
export const clearAuth = () => {
  removeToken();
  persistentStore().removeItem(USER_KEY);
  sessionStore().removeItem(USER_KEY);
  persistentStore().removeItem(PERSIST_KEY);
};
