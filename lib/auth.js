// Sign-in with Auth0 (tridnguyen.auth0.com).
// The Auth0 SDK is loaded only when a page asks for it, so pages without
// sign-in (airports, miles) don't download it.

// Client ID of the "Auth" SPA application in the tridnguyen.auth0.com tenant.
const clientId = "IxcfVZqCVF9b5FS2NVVnElOeBnoNG02Z";

// Every section uses one callback and logout URL: the site root
// (https://tridnguyen.com/fly/). The root page finishes the redirect and sends
// the user back to the page they came from, so new sections need no Auth0
// changes.
const BASE = import.meta.env.BASE_URL;
const AUTH_HOME = new URL(BASE, location.origin).href;
const LOGOUT_RETURN_KEY = "fly-auth-logout-return";

// Tokens are for the sheets API, which also needs the `email` scope: it looks
// up the signed-in user's email to check access to each spreadsheet.
export const SHEETS_API = "https://sheets.cloud.tridnguyen.com";

// The client is created directly rather than with createAuth0Client() (or
// @tridnguyen/auth/spa, which wraps it), because that runs checkSession() on
// startup. When the "is authenticated" cookie for this client ID exists (the
// conf site on the same domain sets it) but there's no refresh token for the
// sheets API saved, checkSession() falls back to a hidden iframe to Auth0 and
// waits up to 60 seconds for it, leaving the page stuck on "Checking
// sign-in". Without it, sign-in state comes from the saved tokens alone.
// useRefreshTokensFallback is off so getting a token never uses that iframe
// either; when a refresh token is missing or expired, the user signs in again
// (instant if their Auth0 session is still active).
let clientPromise;
function getClient() {
  clientPromise ||= import("@auth0/auth0-spa-js").then(
    ({ Auth0Client }) =>
      new Auth0Client({
        domain: "tridnguyen.auth0.com",
        clientId,
        cacheLocation: "localstorage",
        useRefreshTokens: true,
        useRefreshTokensFallback: false,
        authorizationParams: {
          redirect_uri: AUTH_HOME,
          audience: SHEETS_API,
          scope: "openid profile email",
        },
      }),
  );
  return clientPromise;
}

const currentPath = () => location.pathname + location.search + location.hash;

// Only send users back to pages on this site, under the base path.
function safeReturnPath(path) {
  if (!path) return null;
  try {
    const url = new URL(path, location.origin);
    if (url.origin === location.origin && url.pathname.startsWith(BASE)) {
      return url.pathname + url.search + url.hash;
    }
  } catch (e) {}
  return null;
}

/**
 * For pages that need sign-in. Resolves to { user, login, logout, getToken };
 * `user` is null when signed out. login() and logout() return to the current
 * page. getToken({ fresh }) returns an access token for the sheets API;
 * `fresh` skips the cached token.
 */
export async function initAuth() {
  const client = await getClient();
  const user = (await client.isAuthenticated())
    ? (await client.getUser()) || {}
    : null;
  return {
    user,
    getToken: ({ fresh = false } = {}) =>
      client.getTokenSilently(fresh ? { cacheMode: "off" } : {}),
    login: () =>
      client.loginWithRedirect({ appState: { returnTo: currentPath() } }),
    logout: () => {
      try {
        sessionStorage.setItem(LOGOUT_RETURN_KEY, currentPath());
      } catch (e) {}
      return client.logout({ logoutParams: { returnTo: AUTH_HOME } });
    },
  };
}

/** True if this page load is coming back from Auth0 (login or logout). */
export function isAuthRedirect() {
  const q = new URLSearchParams(location.search);
  if (q.has("state") && (q.has("code") || q.has("error"))) return true;
  try {
    return !!sessionStorage.getItem(LOGOUT_RETURN_KEY);
  } catch (e) {
    return false;
  }
}

/**
 * For the root page. Finishes a login or logout redirect and sends the user
 * back to where they started. Returns true if it is navigating away.
 */
export async function handleAuthRedirect() {
  const q = new URLSearchParams(location.search);
  if (q.has("state") && (q.has("code") || q.has("error"))) {
    let to = null;
    try {
      const { appState } = await (await getClient()).handleRedirectCallback();
      to = safeReturnPath(appState?.returnTo);
    } catch (e) {
      console.error("Auth callback failed", e);
    }
    // Either way, drop ?code&state from the URL.
    location.replace(to || BASE);
    return true;
  }
  let pending = null;
  try {
    pending = sessionStorage.getItem(LOGOUT_RETURN_KEY);
    sessionStorage.removeItem(LOGOUT_RETURN_KEY);
  } catch (e) {}
  const to = safeReturnPath(pending);
  if (to) {
    location.replace(to);
    return true;
  }
  return false;
}
