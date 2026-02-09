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
 * Clear user authentication data
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('user_email');
  localStorage.removeItem('user_name');
  localStorage.removeItem('access_token');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getUserEmail() !== null;
}
