//store/apiFetchLaravel.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BaseQueryFn, FetchArgs, FetchBaseQueryError, FetchBaseQueryMeta } from '@reduxjs/toolkit/query';
import { getSession } from 'next-auth/react';
import Cookies from 'js-cookie';

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
  // Fetch Sanctum CSRF cookie
  const session = await getSession();
  // Try multiple sources for the token
  const token = session?.accessAuthToken || 
                session?.accessToken || 
                (typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('auth_token') : null);
  
  // Debug logging for authentication (disabled by default to reduce console noise)
  // Set NEXT_PUBLIC_DEBUG_API=true in .env.local to enable
  const shouldDebug = typeof window !== 'undefined' && window.localStorage.getItem('DEBUG_API') === 'true';
  if (process.env.NODE_ENV === 'development' && shouldDebug) {
    console.log('API Request Debug:', {
      hasSession: !!session,
      hasToken: !!token,
      tokenLength: token?.length,
      userEmail: session?.user?.email,
      userRole: session?.user?.role,
      accessAuthToken: session?.accessAuthToken ? `${session.accessAuthToken.substring(0, 20)}...` : 'missing',
      accessToken: session?.accessToken ? `${session.accessToken.substring(0, 20)}...` : 'missing',
      localStorageToken: typeof window !== 'undefined' ? (localStorage.getItem('token') ? 'exists' : 'missing') : 'N/A'
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
        headers.set('Authorization', `Bearer ${token}`);
        // Debug: Log the actual header being set (disabled by default)
        const shouldDebug = typeof window !== 'undefined' && window.localStorage.getItem('DEBUG_API') === 'true';
        if (process.env.NODE_ENV === 'development' && shouldDebug) {
          console.log('Setting Authorization header:', {
            hasToken: !!token,
            tokenPrefix: token ? `${token.substring(0, 10)}...` : 'none',
            fullHeader: `Bearer ${token?.substring(0, 20)}...`
          });
        }
      } else {
        // Debug: Log when token is missing
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ No token available for API request!', {
            hasSession: !!session,
            sessionKeys: session ? Object.keys(session) : [],
            accessAuthToken: session?.accessAuthToken ? 'exists' : 'missing',
            accessToken: session?.accessToken ? 'exists' : 'missing'
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