//store/apiFetchLaravel.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BaseQueryFn, FetchArgs, FetchBaseQueryError, FetchBaseQueryMeta } from '@reduxjs/toolkit/query';
import { getSession } from 'next-auth/react';
import Cookies from 'js-cookie';

/**
 * Helper function to get authentication token from multiple sources
 * This ensures consistent token retrieval across the application
 * Can be used both in RTK Query and other parts of the application
 *
 * Priority order:
 * 1. localStorage (most reliable, set immediately after login)
 * 2. NextAuth session (may have timing issues)
 * 3. Cookies (for Sanctum cookie-based auth)
 */
// In-memory token cache to avoid redundant localStorage/cookie lookups
let cachedToken: string | null = null;
let lastTokenCheck = 0;
const TOKEN_CACHE_TTL = 30000; // 30 seconds

export async function getAuthToken(): Promise<string | null> {
	// Only run on client side
	if (typeof window === 'undefined') {
		return null;
	}

	const now = Date.now();

	// Return cached token if it's fresh enough (less than 30s old)
	if (cachedToken && now - lastTokenCheck < TOKEN_CACHE_TTL) {
		return cachedToken;
	}

	// First, check localStorage (most reliable - set immediately after login)
	let token =
		localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('access_token');

	if (token && typeof token === 'string' && token.trim() !== '') {
		cachedToken = token.trim();
		lastTokenCheck = now;
		return cachedToken;
	}

	// Then try to get session token
	let session = null;
	try {
		session = await getSession();

		if (session) {
			const sessionAny = session as any;
			token =
				sessionAny?.accessAuthToken ||
				sessionAny?.accessToken ||
				sessionAny?.token?.accessAuthToken ||
				sessionAny?.token?.accessToken ||
				null;

			if (token && typeof token === 'string' && token.trim() !== '') {
				const cleanToken = token.trim();
				localStorage.setItem('auth_token', cleanToken);
				localStorage.setItem('token', cleanToken);
				cachedToken = cleanToken;
				lastTokenCheck = now;
				return cleanToken;
			}
		}
	} catch (_error) {
		// Silently fail
	}

	// Fallback to cookies
	const cookieToken = Cookies.get('auth_token') || Cookies.get('sanctum_token');

	if (cookieToken && typeof cookieToken === 'string' && cookieToken.trim() !== '') {
		const cleanToken = cookieToken.trim();
		localStorage.setItem('auth_token', cleanToken);
		localStorage.setItem('token', cleanToken);
		cachedToken = cleanToken;
		lastTokenCheck = now;
		return cleanToken;
	}

	cachedToken = null;
	return null;
}

// function getXsrfToken() {
//   console.log(Cookies.get('XSRF-TOKEN', 'check token'));
//   return Cookies.get('XSRF-TOKEN');
// }

// console.log('XSRF-TOKEN:', Cookies.get('XSRF-TOKEN')); // 🔥 Should print token

// export const API_BASE_URL = BASEURLAPI;
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// API base URL is available at: process.env.NEXT_PUBLIC_API_URL

// export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://api.multikonnect.test:8000';
export const globalHeaders = {
	// Intentionally omit default 'Content-Type' to allow FormData uploads to set proper boundaries
	// 'Content-Type': 'application/json',
	// 'X-XSRF-TOKEN': getXsrfToken(),
	// 'Origin': BASEURLAPI,
};

// Function to check if we're already handling a 401 (using sessionStorage for reliability)
function isHandling401(): boolean {
	if (typeof window === 'undefined') return false;

	return sessionStorage.getItem('_handling_401') === 'true';
}

// Function to set the 401 handling flag
function setHandling401(value: boolean): void {
	if (typeof window === 'undefined') return;

	if (value) {
		sessionStorage.setItem('_handling_401', 'true');
	} else {
		sessionStorage.removeItem('_handling_401');
	}
}

// Clear the flag when on login page (in case user navigated there manually)
// This runs only on the client side
if (typeof window !== 'undefined' && window.location.pathname.includes('/sign-in')) {
	setHandling401(false);
}

const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, object, FetchBaseQueryMeta> = async (
	args,
	api,
	extraOptions
) => {
	// Early exit if we're already handling a 401 redirect (prevents multiple simultaneous requests from all processing)
	if (typeof window !== 'undefined' && isHandling401()) {
		// Return an error immediately without making the request
		return {
			error: {
				status: 401,
				data: { message: 'Authentication required. Redirecting to login...' }
			} as FetchBaseQueryError
		};
	}

	// Intercept /api/mock/* routes - these are Next.js API routes, not Laravel routes
	// Return a successful empty response to prevent 500 errors
	const requestUrl = typeof args === 'string' ? args : (args as FetchArgs).url || '';

	if (String(requestUrl).startsWith('/api/mock/')) {
		// Return a successful response without making the actual request
		// Mock notifications are handled by Next.js API routes, not Laravel
		return {
			data: {} as unknown
		};
	}

	// Get token using the helper function
	const token = await getAuthToken();

	// Fetch Sanctum CSRF cookie (for cookie-based auth, but only if we don't have a Bearer token)
	// This helps with cookie-based Sanctum authentication
	if (!token && typeof window !== 'undefined') {
		try {
			await fetch(`${API_BASE_URL}/sanctum/csrf-cookie`, {
				credentials: 'include'
			});
		} catch (e) {
			// Silently fail - CSRF cookie fetch is optional
		}
	}

	// Debug logging for authentication (disabled by default to reduce console noise)
	// Set DEBUG_API=true in localStorage to enable
	const shouldDebug = typeof window !== 'undefined' && window.localStorage.getItem('DEBUG_API') === 'true';

	if (process.env.NODE_ENV === 'development' && shouldDebug) {
		const sessionAny = session as any;
		console.log('API Request Debug:', {
			hasSession: !!session,
			hasToken: !!token,
			tokenLength: token?.length,
			tokenPrefix: token ? `${token.substring(0, 10)}...` : 'none',
			userEmail: session?.user?.email,
			userRole: session?.user?.role,
			sessionKeys: session ? Object.keys(session) : [],
			accessAuthToken: sessionAny?.accessAuthToken
				? `${String(sessionAny.accessAuthToken).substring(0, 20)}...`
				: 'missing',
			accessToken: sessionAny?.accessToken ? `${String(sessionAny.accessToken).substring(0, 20)}...` : 'missing',
			localStorageToken:
				typeof window !== 'undefined'
					? localStorage.getItem('token') ||
						localStorage.getItem('auth_token') ||
						localStorage.getItem('access_token')
						? 'exists'
						: 'missing'
					: 'N/A',
			url: typeof args === 'string' ? args : (args as FetchArgs).url
		});
	}

	// Inspect body to set headers conditionally (avoid setting JSON Content-Type for FormData)
	const isFormData =
		typeof args === 'object' && args !== null && 'body' in args && (args as FetchArgs).body instanceof FormData;

	// Fix: Ensure empty objects are properly handled for POST/PUT/PATCH requests
	// RTK Query's fetchBaseQuery should handle this, but we ensure it's explicitly an object
	let modifiedArgs = args;

	if (typeof args === 'object' && args !== null && 'body' in args && 'method' in args) {
		const method = (args as FetchArgs).method?.toUpperCase();
		const body = (args as FetchArgs).body;
		const url = (args as FetchArgs).url;

		// For POST/PUT/PATCH with empty object, ensure it's a valid empty object (not undefined/null)
		// Laravel expects either no body or a valid JSON body
		if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && !isFormData) {
			// If body is explicitly an empty object, ensure it's sent correctly
			if (
				body !== undefined &&
				body !== null &&
				typeof body === 'object' &&
				!Array.isArray(body) &&
				Object.keys(body).length === 0
			) {
				// Empty object - this is valid, keep it as is (fetchBaseQuery will JSON.stringify it)
				modifiedArgs = args; // No change needed, {} is valid
			} else if (body === undefined || body === null) {
				// No body - remove body property entirely for methods that don't require it
				const { body: _, ...argsWithoutBody } = args as any;
				modifiedArgs = argsWithoutBody as FetchArgs;
			}
		}

		// KYC submit debug logging removed for performance
	}

	const result = await fetchBaseQuery({
		baseUrl: API_BASE_URL,
		// Use 'include' for CORS, but Sanctum Bearer tokens work with 'omit' too
		credentials: 'include', // Changed to include to ensure CORS works properly
		// Safely handle non-JSON responses (e.g., HTML error pages / redirects)
		responseHandler: async (response) => {
			const ct = response.headers.get('content-type') || '';

			if (ct.includes('application/json')) {
				const json = await response.json();

				// Log 422 errors with full details for debugging
				if (response.status === 422 && process.env.NODE_ENV === 'development') {
					console.error('🔴 422 Response Body:', {
						status: response.status,
						statusText: response.statusText,
						headers: Object.fromEntries(response.headers.entries()),
						body: json,
						fullJson: JSON.stringify(json, null, 2)
					});
				}

				return json;
			}

			return await response.text();
		},
		prepareHeaders: (headers) => {
			Object.entries(globalHeaders).forEach(([key, value]) => {
				if (value !== undefined) headers.set(key, value as string);
			});

			if (!headers.has('Accept')) {
				headers.set('Accept', 'application/json');
			}

			if (!isFormData) {
				// Set JSON content-type only for non-FormData requests
				if (!headers.has('Content-Type')) {
					headers.set('Content-Type', 'application/json');
				}
			} else {
				// Ensure Content-Type is not set so browser can set multipart/form-data with boundary
				headers.delete('Content-Type');
			}

			if (token) {
				// Ensure token is properly formatted (remove any extra whitespace)
				const cleanToken = token.trim();

				if (cleanToken) {
					headers.set('Authorization', `Bearer ${cleanToken}`);

					// Always log in development when setting auth header (to help debug 401s)
					if (process.env.NODE_ENV === 'development') {
						const shouldDebug =
							typeof window !== 'undefined' && window.localStorage.getItem('DEBUG_API') === 'true';
						const requestUrl = typeof args === 'string' ? args : (args as FetchArgs).url;

						if (shouldDebug) {
							console.log('✅ Setting Authorization header:', {
								hasToken: !!cleanToken,
								tokenPrefix: cleanToken ? `${cleanToken.substring(0, 10)}...` : 'none',
								tokenLength: cleanToken.length,
								fullHeader: `Bearer ${cleanToken.substring(0, 20)}...`,
								url: requestUrl
							});
						}


					}
				} else {
					// Token exists but is empty after trimming - treat as missing
					if (process.env.NODE_ENV === 'development') {
						console.warn('⚠️ Token is empty after trimming, treating as missing');
					}
				}
				// No token available
				if (process.env.NODE_ENV === 'development') {
					const shouldDebug =
						typeof window !== 'undefined' && window.localStorage.getItem('DEBUG_API') === 'true';
					if (shouldDebug) {
						const requestUrl = typeof args === 'string' ? args : (args as FetchArgs).url;
						console.warn('⚠️ No token available for API request:', requestUrl);
					}
				}
			}

			return headers;
		}
	})(modifiedArgs, api, extraOptions);

	// ✅ Log full error details for 422 errors (Unprocessable Entity / Validation errors)
	if (process.env.NODE_ENV === 'development' && result.error?.status === 422) {
		const requestUrl = typeof modifiedArgs === 'string' ? modifiedArgs : (modifiedArgs as FetchArgs).url;
		console.error('🚨 422 Unprocessable Entity - Full Error Details:', {
			url: requestUrl,
			status: result.error?.status,
			error: result.error,
			data: result.error?.data,
			originalStatus: (result.error as any)?.originalStatus,
			message: (result.error?.data as Record<string, unknown>)?.['message'] || (result.error?.data as Record<string, unknown>)?.['error'],
			errors: (result.error?.data as any)?.errors,
			fullResponse: JSON.stringify(result.error, null, 2)
		});
	}

	// ✅ Debug warning for 419 errors (Page Expired)
	if (process.env.NODE_ENV === 'development' && result.error?.status === 419) {
		console.warn('⚠️ Page expired (419). If using Bearer token, remove credentials: "include" from baseQuery.');
	}

	// ✅ Handle 401 Unauthorized errors - clear invalid tokens and redirect to login
	if (result.error?.status === 401) {
		// Skip if already on sign-in page
		if (typeof window !== 'undefined' && window.location.pathname.includes('/sign-in')) {
			return result;
		}

		const requestUrl = typeof args === 'string' ? args : (args as FetchArgs).url;

		// Set flag FIRST to prevent race conditions with multiple simultaneous requests
		// This must happen before any other checks to ensure atomicity
		const wasHandling = isHandling401();

		if (!wasHandling) {
			setHandling401(true);
		}

		// Only do cleanup/redirect if this is the first 401 we're handling
		if (!wasHandling && typeof window !== 'undefined') {
			// Log once for the first 401 (only in dev, and only once)
			if (process.env.NODE_ENV === 'development') {
				console.error('🚨 401 Unauthorized - Redirecting to login (tokens cleared)');
			}

			// Clear all token storage immediately (synchronous)
			localStorage.removeItem('token');
			localStorage.removeItem('auth_token');
			localStorage.removeItem('access_token');

			// Clear cookies (synchronous)
			Cookies.remove('auth_token');
			Cookies.remove('sanctum_token');

			// Redirect IMMEDIATELY - this stops all JavaScript execution
			// Using replace() instead of href for immediate navigation without history entry
			window.location.replace('/sign-in');
		}

		// Return error for all 401s (prevents RTK Query from retrying or processing further)
		return {
			error: {
				status: 401,
				data: { message: 'Unauthorized' }
			} as FetchBaseQueryError
		};
	}

	// If server returned text/HTML, attach as string for better error visibility
	if (result.error && typeof (result as any).data === 'string') {
		const text = (result as any).data as string;

		// Detect common redirect HTML and convert to clearer error
		if (text.startsWith('<') && text.toLowerCase().includes('<!doctype html')) {
			(result.error as any).data = {
				message:
					'Received HTML response (likely redirect). Ensure you are authenticated as admin and CORS/Accept headers are set.'
			} as any;
		} else {
			(result.error as any).data = { message: text } as any;
		}
	}

	// Handle connection errors (ERR_CONNECTION_RESET, Failed to fetch, etc.)
	if (result.error && !result.error.status) {
		const errorMessage = String(
			(result.error as any).error || (result.error as any).data?.message || 'Connection error'
		);
		const isConnectionError =
			errorMessage.includes('Failed to fetch') ||
			errorMessage.includes('ERR_CONNECTION_RESET') ||
			errorMessage.includes('NetworkError') ||
			errorMessage.includes('Network request failed') ||
			errorMessage.includes('ERR_CONNECTION_REFUSED') ||
			errorMessage.includes('ERR_NAME_NOT_RESOLVED');

		if (isConnectionError) {
			const requestUrl = typeof args === 'string' ? args : (args as FetchArgs).url;
			const fullUrl = `${API_BASE_URL}${requestUrl}`;

			if (process.env.NODE_ENV === 'development') {
				console.error('🚨 Connection Error:', {
					error: errorMessage,
					apiBaseUrl: API_BASE_URL,
					requestUrl,
					fullUrl,
					suggestion: 'Check if NEXT_PUBLIC_API_URL is correct and the API server is accessible'
				});
			}

			// Enhance error with connection-specific message
			(result.error as any).data = {
				message: `Connection failed: ${errorMessage}. API URL: ${fullUrl}`,
				connectionError: true,
				apiBaseUrl: API_BASE_URL,
				requestUrl
			};
			(result.error as any).status = 'FETCH_ERROR';
		}
	}

	return result;
};

export const apiServiceLaravel = createApi({
	baseQuery,
	endpoints: () => ({}),
	reducerPath: 'apiServiceLaravel',
	keepUnusedDataFor: 600, // Keep data in Redux cache for 10 minutes
	refetchOnMountOrArgChange: 300 // Only refetch if data is older than 5 min
});

export default apiServiceLaravel;
