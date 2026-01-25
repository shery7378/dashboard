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
          role: Array.isArray(data.user.roles)
            ? data.user.roles
            : (data.user.roles && typeof data.user.roles === 'object'
              ? Object.values(data.user.roles)
              : [data.user.roles || 'guest']),
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

      if (session && session.user) {
        // Simplified session handling - use defaults without database fetch to prevent delays
        const defaultDbUser: User = {
          id: session.user.id || token.id?.toString() || '',
          email: session.user.email || token.email || '',
          displayName: session.user.name || token.name || '',
          role: session.user.role || (Array.isArray(token.role) ? token.role : [token.role || 'guest']),
          photoURL: session.user.image || '/assets/images/avatars/brian-hughes.jpg',
          settings: { layout: {}, theme: {} },
          shortcuts: ['apps.calendar', 'apps.mailbox', 'apps.contacts']
        } as User;

        // Set session.db directly without database fetch to prevent timing issues
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