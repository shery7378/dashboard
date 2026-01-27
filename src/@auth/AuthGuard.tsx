'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import FuseUtils from '@fuse/utils';
import {
  getSessionRedirectUrl,
  resetSessionRedirectUrl,
  setSessionRedirectUrl
} from '@fuse/core/FuseAuthorization/sessionRedirectUrl';
import FuseLoading from '@fuse/core/FuseLoading';
import useNavigate from '@fuse/hooks/useNavigate';
import usePathname from '@fuse/hooks/usePathname';
import MainLayout from 'src/components/MainLayout';
import Error401Page from '@/app/(public)/401/Error401Page';
import StoreCheck from '@/app/(control-panel)/apps/e-commerce/products/[productId]/[[...handle]]/StoreCheck';
import authRoles from './authRoles';

type AuthGuardProps = {
  auth?: string[]; // roles allowed
  children: React.ReactNode;
  loginRedirectUrl?: string;
  mode?: 'redirect' | 'inline'; // 👈 NEW
  from?: string; // 👈 NEW
};

export default function AuthGuard({
  auth,
  children,
  loginRedirectUrl = '/',
  mode = 'redirect',
  from,
}: AuthGuardProps) {
  const { data: user, status } = useSession();
  const userRole = user?.db?.role || [];
  const profileId = user?.db?.profile_id;
  const storeId = user?.db?.store_id;
  const navigate = useNavigate();
  const pathname = usePathname();

  useEffect(() => {
    if (status?.trim() !== 'authenticated') return; // only run when authenticated
    // Only redirect to profile if user is not admin AND has no profile AND no store
    // Vendors/suppliers with stores should be able to access their pages
    const isAdmin = user?.db?.role?.includes("admin");
    const hasProfile = profileId != null;
    const hasStore = storeId != null;
    
    if (!isAdmin && !hasProfile && !hasStore) {
      console.log('AuthGuard: Redirecting to profile - no profile and no store');
      navigate('/accounts/profile');
    }
  }, [status, profileId, storeId, from, navigate, user]);

  const [accessGranted, setAccessGranted] = useState(false);

  const isGuest = !user; // you may adapt if your `useUser()` hook is different

  // Function to handle redirection
  const handleRedirection = useCallback(() => {
    const redirectUrl = getSessionRedirectUrl() || loginRedirectUrl;

    if (isGuest) {
      navigate('/sign-in');
    } else {
      navigate(redirectUrl);
      resetSessionRedirectUrl();
    }
  }, [isGuest, loginRedirectUrl, navigate]);

  // Check permissions
  useEffect(() => {
    if (status === 'loading') return;

    const isOnlyGuestAllowed = Array.isArray(auth) && auth.length === 0;
    const userHasPermission = !auth || FuseUtils.hasPermission(auth, userRole);
    const ignoredPaths = ['/', '/callback', '/sign-in', '/sign-up', '/sign-out', '/logout', '/404'];

    if (userHasPermission || (isOnlyGuestAllowed && isGuest)) {
      setAccessGranted(true);
      return;
    }

    // No permission
    if (mode === 'redirect') {
      if (isGuest && !ignoredPaths.includes(pathname)) {
        setSessionRedirectUrl(pathname);
      } else if (!isGuest && !ignoredPaths.includes(pathname)) {
        setSessionRedirectUrl(isOnlyGuestAllowed ? '/' : '/401');
      }
      handleRedirection();
    } else {
      setAccessGranted(false);
    }
  }, [auth, userRole, isGuest, pathname, handleRedirection, status, mode]);

  if (status === 'loading') {
    return <FuseLoading />;
  }

  // 🔴 Inline mode: show 401 page inside layout if not allowed
  if (!accessGranted && mode === 'inline') {
    return (
      //   <MainLayout>
      <Error401Page />
      //   </MainLayout>
    );
  }
  if (status === 'authenticated' && !authRoles.admin && from === 'addProduct' && !storeId) {
    return <StoreCheck />;
  }
  // ✅ Access granted
  return accessGranted ? <>{children}</> : <FuseLoading />;
}
