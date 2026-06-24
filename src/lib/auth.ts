/**
 * Utility functions for authentication
 * Note: Using localStorage since static export doesn't support httpOnly cookies
 */

/**
 * Get the user's email from localStorage
 */
export function getUserEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('user_email');
}

/**
 * Get user name from localStorage
 */
export function getUserName(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('user_name');
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

/**
 * Epoch-ms time the Google access token expires (stored at login), or null.
 */
export function getTokenExpiry(): number | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem('token_expiry');
  return v ? Number(v) : null;
}

/**
 * Clear user authentication data
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('user_email');
  localStorage.removeItem('user_name');
  localStorage.removeItem('access_token');
  localStorage.removeItem('token_expiry');
}

/**
 * Check if the user has a stored identity. NOTE: this does not mean the access
 * token is still valid — use isSessionValid() before any authenticated request.
 */
export function isAuthenticated(): boolean {
  return getUserEmail() !== null;
}

/**
 * A usable session = we have an email, an access token, and the token has not
 * expired. Google access tokens last ~1 hour, so a stored identity from days
 * ago will fail isSessionValid() and should trigger a re-login. A 30s skew
 * avoids using a token that's about to expire. If the expiry is unknown (logged
 * in before expiry was tracked), treat the session as expired so we re-auth.
 */
export function isSessionValid(): boolean {
  if (typeof window === 'undefined') return false;
  if (!getUserEmail() || !getAccessToken()) return false;
  const expiry = getTokenExpiry();
  if (expiry === null) return false;
  return Date.now() < expiry - 30_000;
}

/**
 * Start the Google OAuth (implicit) flow. After sign-in the callback returns to
 * `redirectUrl`, or straight to the given faculty's edit page when `facultyId`
 * is provided. Used both for first login and to re-login after expiry.
 */
export function loginWithGoogle(
  opts: { redirectUrl?: string; facultyId?: string | number } = {}
): void {
  if (typeof window === 'undefined') return;
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    alert('Google OAuth not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID.');
    return;
  }
  const state = btoa(JSON.stringify({
    redirectUrl: opts.redirectUrl ?? '/',
    facultyId: opts.facultyId != null ? String(opts.facultyId) : null,
  }));
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', `${window.location.origin}/auth/callback`);
  authUrl.searchParams.set('response_type', 'token'); // implicit flow (client-side)
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('hd', 'ucsb.edu'); // UCSB Workspace hint
  authUrl.searchParams.set('state', state);
  window.location.href = authUrl.toString();
}

/**
 * Sign the user out: clear stored auth and return to the home page.
 */
export function logout(): void {
  clearAuth();
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
}
