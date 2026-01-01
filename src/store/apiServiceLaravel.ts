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
export async function getAuthToken(): Promise<string | null> {
  // Only run on client side
  if (typeof window === 'undefined') {
    return null;
  }

  // First, check localStorage (most reliable - set immediately after login)
  // This is prioritized because it's set synchronously during login
  let token = localStorage.getItem('token') || 
              localStorage.getItem('auth_token') || 
              localStorage.getItem('access_token');
  
  if (token && typeof token === 'string' && token.trim() !== '') {
    return token.trim();
  }
  
  // Then try to get session token (may have timing issues, but good for consistency)
  let session = null;
  try {
    session = await getSession();
    if (session) {
      // Access token properties with proper type handling
      const sessionAny = session as any;
      token = sessionAny?.accessAuthToken || 
              sessionAny?.accessToken || 
              sessionAny?.token?.accessAuthToken ||
              sessionAny?.token?.accessToken ||
              null;
      
      // If we found a token in session, validate and return it
      if (token && typeof token === 'string' && token.trim() !== '') {
        // Also store it in localStorage for future use
        localStorage.setItem('auth_token', token.trim());
        localStorage.setItem('token', token.trim());
        return token.trim();
      }
    }
  } catch (error) {
    // Silently fail - we'll try cookies as fallback
    if (process.env.NODE_ENV === 'development') {
      const shouldDebug = window.localStorage.getItem('DEBUG_API') === 'true';
      if (shouldDebug) {
        console.warn('Failed to get session token:', error);
      }
    }
  }
  
  // Fallback to cookies (for Sanctum cookie-based auth)
  const cookieToken = Cookies.get('auth_token') || Cookies.get('sanctum_token');
  if (cookieToken && typeof cookieToken === 'string' && cookieToken.trim() !== '') {
    // Store in localStorage for future use
    localStorage.setItem('auth_token', cookieToken.trim());
    localStorage.setItem('token', cookieToken.trim());
    return cookieToken.trim();
  }
  
  return null;
}

// function getXsrfToken() {
//   console.log(Cookies.get('XSRF-TOKEN', 'check token'));
//   return Cookies.get('XSRF-TOKEN');
// }

// console.log('XSRF-TOKEN:', Cookies.get('XSRF-TOKEN')); // 🔥 Should print token

// export const API_BASE_URL = BASEURLAPI;
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://api.multikonnect.test:8000';
export const globalHeaders = {
  // Intentionally omit default 'Content-Type' to allow FormData uploads to set proper boundaries
  // 'Content-Type': 'application/json',
  // 'X-XSRF-TOKEN': getXsrfToken(),
  // 'Origin': BASEURLAPI,
};

const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, object, FetchBaseQueryMeta> = async (
  args,
  api,
  extraOptions
) => {
  // Get token using the helper function
  const token = await getAuthToken();
  
  // Also get session for debugging purposes
  let session = null;
  try {
    session = await getSession();
  } catch (sessionError) {
    // Silently handle session errors
  }

  // Fetch Sanctum CSRF cookie (for cookie-based auth, but only if we don't have a Bearer token)
  // This helps with cookie-based Sanctum authentication
  if (!token && typeof window !== 'undefined') {
    try {
      await fetch(`${API_BASE_URL}/sanctum/csrf-cookie`, {
        credentials: 'include',
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
      accessAuthToken: sessionAny?.accessAuthToken ? `${String(sessionAny.accessAuthToken).substring(0, 20)}...` : 'missing',
      accessToken: sessionAny?.accessToken ? `${String(sessionAny.accessToken).substring(0, 20)}...` : 'missing',
      localStorageToken: typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('access_token') ? 'exists' : 'missing') : 'N/A',
      url: typeof args === 'string' ? args : (args as FetchArgs).url
    });
  }
  // Inspect body to set headers conditionally (avoid setting JSON Content-Type for FormData)
  const isFormData = typeof args === 'object' && args !== null && 'body' in args && (args as FetchArgs).body instanceof FormData;

  const result = await fetchBaseQuery({
    baseUrl: API_BASE_URL,
    // Use 'include' for CORS, but Sanctum Bearer tokens work with 'omit' too
    credentials: 'include', // Changed to include to ensure CORS works properly
    // Safely handle non-JSON responses (e.g., HTML error pages / redirects)
    responseHandler: async (response) => {
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        return await response.json();
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
            const shouldDebug = typeof window !== 'undefined' && window.localStorage.getItem('DEBUG_API') === 'true';
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
            // Always log for orders endpoint to help debug
            if (requestUrl && String(requestUrl).includes('/orders')) {
              console.log('🔐 Auth header set for orders request:', {
                url: requestUrl,
                tokenLength: cleanToken.length,
                tokenPrefix: `${cleanToken.substring(0, 15)}...`,
                headerSet: headers.has('Authorization')
              });
            }
          }
        } else {
          // Token exists but is empty after trimming - treat as missing
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Token is empty after trimming, treating as missing');
          }
        }
      } else {
        // Always log when token is missing in development (this is important!)
        if (process.env.NODE_ENV === 'development') {
          const sessionAny = session as any;
          const requestUrl = typeof args === 'string' ? args : (args as FetchArgs).url;
          console.error('❌ No token available for API request!', {
            url: requestUrl,
            hasSession: !!session,
            sessionKeys: session ? Object.keys(session) : [],
            accessAuthToken: sessionAny?.accessAuthToken ? 'exists' : 'missing',
            accessToken: sessionAny?.accessToken ? 'exists' : 'missing',
            localStorageToken: typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('access_token') ? 'exists' : 'missing') : 'N/A',
            cookieToken: typeof window !== 'undefined' ? (Cookies.get('auth_token') || Cookies.get('sanctum_token') ? 'exists' : 'missing') : 'N/A'
          });
        }
      }
      return headers;
    },
  })(args, api, extraOptions);

  // ✅ Debug warning for 419 errors (Page Expired)
  if (process.env.NODE_ENV === 'development' && result.error?.status === 419) {
    console.warn('⚠️ Page expired (419). If using Bearer token, remove credentials: "include" from baseQuery.');
  }

  // ✅ Handle 401 Unauthorized errors - redirect to login if token is missing
  if (result.error?.status === 401) {
    const requestUrl = typeof args === 'string' ? args : (args as FetchArgs).url;
    const sessionAny = session as any;
    
    // Always log 401 errors in development with detailed info
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 401 Unauthorized Error:', {
        url: requestUrl,
        hasSession: !!session,
        hasToken: !!token,
        tokenType: token ? typeof token : 'none',
        tokenLength: token ? token.length : 0,
        tokenPrefix: token ? `${token.substring(0, 15)}...` : 'none',
        sessionKeys: session ? Object.keys(session) : [],
        sessionUser: session?.user ? {
          email: session.user.email,
          id: (session.user as any).id
        } : 'no user',
        accessAuthToken: sessionAny?.accessAuthToken ? `${String(sessionAny.accessAuthToken).substring(0, 15)}...` : 'missing',
        accessToken: sessionAny?.accessToken ? `${String(sessionAny.accessToken).substring(0, 15)}...` : 'missing',
        localStorageToken: typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('access_token') ? 'exists' : 'missing') : 'N/A',
        cookieToken: typeof window !== 'undefined' ? (Cookies.get('auth_token') || Cookies.get('sanctum_token') ? 'exists' : 'missing') : 'N/A',
        errorData: result.error?.data,
        suggestion: !token ? 'Token is missing - check if session is loaded' : 'Token exists but Laravel rejected it - check if token is valid/expired'
      });
    }
    
    // Only redirect if we're in the browser and not already on the login page
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/sign-in')) {
      // Check if token exists - if not, redirect to login
      if (!token) {
        console.warn('No authentication token found. Redirecting to login...');
        window.location.href = '/sign-in';
      } else {
        // Token exists but was rejected - might be expired
        console.warn('Token exists but request was unauthorized. Token may be expired or invalid.');
      }
    }
  }

  // If server returned text/HTML, attach as string for better error visibility
  if (result.error && typeof (result as any).data === 'string') {
    const text = (result as any).data as string;
    // Detect common redirect HTML and convert to clearer error
    if (text.startsWith('<') && text.toLowerCase().includes('<!doctype html')) {
      (result.error as any).data = { message: 'Received HTML response (likely redirect). Ensure you are authenticated as admin and CORS/Accept headers are set.' } as any;
    } else {
      (result.error as any).data = { message: text } as any;
    }
  }

  if (result.error && result.error.status === 401) {
    console.error('Unauthorized request:', result.error);
    // Add token refresh logic here if needed
  }

  return result;
};

export const apiServiceLaravel = createApi({
  baseQuery,
  endpoints: () => ({}),
  reducerPath: 'apiServiceLaravel',
});

export default apiServiceLaravel;