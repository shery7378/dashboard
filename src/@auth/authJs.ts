// src/@auth/authJsProviderMap.ts
import NextAuth from 'next-auth';
import { User } from '@auth/user';
import { createStorage } from 'unstorage';
import memoryDriver from 'unstorage/drivers/memory';
import vercelKVDriver from 'unstorage/drivers/vercel-kv';
import { UnstorageAdapter } from '@auth/unstorage-adapter';
import type { NextAuthConfig } from 'next-auth';
import type { Provider } from 'next-auth/providers';
import Credentials from 'next-auth/providers/credentials';
import Facebook from 'next-auth/providers/facebook';
import Google from 'next-auth/providers/google';
import { authGetDbUserByEmail, authCreateDbUser } from './authApi';
import { FetchApiError } from '@/utils/apiFetch';

const storage = createStorage({
  driver: process.env.VERCEL
    ? vercelKVDriver({
      url: process.env.AUTH_KV_REST_API_URL,
      token: process.env.AUTH_KV_REST_API_TOKEN,
      env: false
    })
    : memoryDriver()
});

export const providers: Provider[] = [
  Credentials({
    async authorize(credentials) {
      try {
        /*       const csrfRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sanctum/csrf-cookie`, {
                 credentials: 'include'
               });
               console.log('CSRF cookie set:', csrfRes.status);
       */
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password
          })
        });

        console.log('Login status:', res.status);
        const data = await res.json();
        console.log('Login response:', data);

        if (!res.ok || !data.user) return null;

        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: Array.isArray(data.user.roles) ? data.user.roles : [data.user.roles || 'guest'],
          accessAuthToken: data.token
        };
      } catch (error) {
        console.error('Authorize error:', error);
        return null;
      }
    }
  }),
  Google,
  Facebook
];

const config = {
  theme: { logo: '/assets/images/logo/logo.svg' },
  adapter: UnstorageAdapter(storage),
  pages: {
    signIn: '/sign-in'
  },
  providers,
  basePath: '/auth',
  trustHost: true,
  // Ensure a stable secret for JWT sessions (Auth.js prefers AUTH_SECRET env)
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  callbacks: {
    authorized() {
      /** Checkout information to how to use middleware for authorization
       * https://next-auth.js.org/configuration/nextjs#middleware
       */
      return true;
    },
    jwt({ token, trigger, account, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role; // Use role (array) from authorize
        token.accessToken = user.accessToken;
        // Store accessAuthToken from the authorize function
        if (user.accessAuthToken) {
          token.accessAuthToken = user.accessAuthToken;
        }
      }

      if (trigger === 'update') {
        token.name = user.name;
      }

      if (account?.provider === 'keycloak') {
        return { ...token, accessToken: account.access_token };
      }

      // Add accessAuthToken to the token if available from the user object (Credentials provider)
      if (user?.accessAuthToken) {
        token.accessAuthToken = user.accessAuthToken;
      }
      // console.log('jwt callback:', token);
      return token;
    },
    async session({ session, token }) {
      if (token.accessToken && typeof token.accessToken === 'string') {
        session.accessToken = token.accessToken;
      }

      // Add accessAuthToken to the session if available from the token
      if (token.accessAuthToken && typeof token.accessAuthToken === 'string') {
        session.accessAuthToken = token.accessAuthToken;
      }

      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = Array.isArray(token.role) ? token.role : [token.role || 'guest']; // Ensure role is an array
        session.accessToken = token.accessToken as string;
      }
      // console.log('session callback:', session);

      if (session && session.user) {
        // Always ensure session.db exists with data from token/session
        // This prevents the session from failing even if database fetch fails
        const defaultDbUser: User = {
          id: session.user.id || token.id?.toString() || '',
          email: session.user.email || token.email || '',
          displayName: session.user.name || token.name || '',
          role: session.user.role || (Array.isArray(token.role) ? token.role : [token.role || 'guest']),
          photoURL: session.user.image || '/assets/images/avatars/brian-hughes.jpg',
          settings: { layout: {}, theme: {} },
          shortcuts: ['apps.calendar', 'apps.mailbox', 'apps.contacts']
        } as User;

        // Only try to fetch from database if we have an access token
        if (session.accessAuthToken) {
        try {
          /**
           * Get the session user from database
           */
          const response = await authGetDbUserByEmail(session.user.email, session.accessAuthToken);

            // Check if response is OK and has content before parsing
            if (response.ok) {
              // Check if response has content before parsing JSON
              const contentType = response.headers.get('content-type');
              
              if (contentType && contentType.includes('application/json')) {
                try {
                  // Read response text - handle empty responses
                  const text = await response.text();
                  
                  if (text && text.trim() !== '') {
                    try {
                      const userDbData = JSON.parse(text) as User;
                      // Merge database data with defaults
          session.db = {
                        ...defaultDbUser,
            ...userDbData,
                        role: session.user.role || (Array.isArray(userDbData.role) ? userDbData.role : [userDbData.role || 'guest']),
                        displayName: session.user.name || userDbData.displayName || defaultDbUser.displayName,
                      };
          return session;
                    } catch (parseError) {
                      console.warn('Failed to parse user data JSON, using defaults:', parseError);
                    }
                  } else {
                    // Empty response - use defaults
                    console.warn('Empty response from /api/user, using defaults');
                  }
                } catch (readError) {
                  console.warn('Failed to read response body, using defaults:', readError);
                }
              } else {
                // Non-JSON response - use defaults
                console.warn('Non-JSON response from /api/user, using defaults');
              }
            } else {
              // If response is not OK, check if it's 404 (user not found)
              const errorStatus = response.status;
          if (errorStatus === 404) {
                try {
            const newUserResponse = await authCreateDbUser({
              email: session.user.email,
                    role: session.user.role || ['admin'],
              displayName: session.user.name,
              photoURL: session.user.image
            });

                  if (newUserResponse.ok) {
                    try {
                      const contentType = newUserResponse.headers.get('content-type');
                      if (contentType && contentType.includes('application/json')) {
                        const text = await newUserResponse.text();
                        if (text && text.trim() !== '') {
                          try {
                            const newUser = JSON.parse(text) as User;
            session.db = {
                              ...defaultDbUser,
              ...newUser,
                              role: session.user.role || (Array.isArray(newUser.role) ? newUser.role : ['admin']),
                            };
            return session;
                          } catch (parseError) {
                            console.warn('Failed to parse new user JSON, using defaults:', parseError);
                          }
                        } else {
                          console.warn('Empty response from user creation, using defaults');
                        }
                      } else {
                        console.warn('Non-JSON response from user creation, using defaults');
                      }
                    } catch (readError) {
                      console.warn('Failed to read new user response, using defaults:', readError);
        }
                  } else {
                    console.warn('User creation failed with status:', newUserResponse.status);
                  }
                } catch (createError) {
                  console.warn('Failed to create user, using defaults:', createError);
                }
              }
            }
          } catch (error) {
            // Log error but don't fail - use default data
            // Only log detailed error info in development to reduce noise
            if (process.env.NODE_ENV === 'development') {
              const errorMessage = error instanceof Error ? error.message : String(error);
              const isFetchError = errorMessage.includes('FetchApiError');
              if (isFetchError) {
                // FetchApiError is already logged in apiFetchLaravel, so just log a brief message
                console.warn('Server Error fetching user from database, using defaults:', errorMessage);
              } else {
                console.warn('Error fetching user from database, using defaults:', error);
              }
            }
          }
        }

        // Use default data if database fetch failed or was skipped
        session.db = defaultDbUser;
        return session;
      }

      return null;
    }
  },
  experimental: {
    enableWebAuthn: true
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  debug: process.env.NODE_ENV !== 'production'
} satisfies NextAuthConfig;

export type AuthJsProvider = {
  id: string;
  name: string;
  style?: {
    text?: string;
    bg?: string;
  };
};

export const authJsProviderMap: AuthJsProvider[] = providers
  .map((provider) => {
    const providerData = typeof provider === 'function' ? provider() : provider;

    return {
      id: providerData.id,
      name: providerData.name,
      style: {
        text: (providerData as { style?: { text: string } }).style?.text,
        bg: (providerData as { style?: { bg: string } }).style?.bg
      }
    };
  })
  .filter((provider) => provider.id !== 'credentials');

export const { handlers, auth, signIn, signOut } = NextAuth(config);