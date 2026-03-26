'use client';

import React, { useCallback, useEffect, useState } from 'react';
import FuseUtils from '@fuse/utils';
import {
	getSessionRedirectUrl,
	resetSessionRedirectUrl,
	setSessionRedirectUrl
} from '@fuse/core/FuseAuthorization/sessionRedirectUrl';
import { FuseRouteObjectType } from '@fuse/core/FuseLayout/FuseLayout';
import usePathname from '@fuse/hooks/usePathname';
import FuseLoading from '@fuse/core/FuseLoading';
import useNavigate from '@fuse/hooks/useNavigate';
import useUser from './useUser';
import { useSession } from 'next-auth/react';

type AuthGuardProps = {
	auth: FuseRouteObjectType['auth'];
	children: React.ReactNode;
	loginRedirectUrl?: string;
};

function AuthGuardRedirect({ auth, children, loginRedirectUrl = '/' }: AuthGuardProps) {
	const { data: user, isGuest } = useUser();
	const userRole = user?.role;
	const navigate = useNavigate();
	const { status } = useSession();

	const [accessGranted, setAccessGranted] = useState<boolean>(false);
	const pathname = usePathname();

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

	// Check user's permissions and set access granted state
	useEffect(() => {
		// Wait for session to finish loading
		if (status === 'loading') {
			return;
		}

		const isOnlyGuestAllowed = Array.isArray(auth) && auth.length === 0;
		const userHasPermission = FuseUtils.hasPermission(auth, userRole);
		const ignoredPaths = ['/', '/callback', '/sign-in', '/sign-up', '/sign-out', '/logout', '/404'];

		// If pathname is in ignoredPaths, always grant access (public pages)
		if (ignoredPaths.includes(pathname)) {
			setAccessGranted(true);
			resetSessionRedirectUrl();
			return;
		}

		// For onlyGuest pages (like signup/signin), allow access if:
		// 1. User is a guest (not authenticated)
		// 2. Session is unauthenticated
		// 3. Or if no auth requirement is set
		if (isOnlyGuestAllowed) {
			if (isGuest || status === 'unauthenticated' || !user) {
				setAccessGranted(true);
				resetSessionRedirectUrl();
				return;
			} else {
				// Authenticated user trying to access guest-only page (like signup/signin)
				// Redirect them to dashboard/home
				navigate('/');
				return;
			}
		}

		// If user has permission, grant access and clear any existing redirect URL
		if (!auth || (auth && userHasPermission)) {
			setAccessGranted(true);
			// Clear any existing redirect URL since user can access this page
			resetSessionRedirectUrl();
			return;
		}

		if (!userHasPermission) {
			if ((isGuest || status === 'unauthenticated') && !ignoredPaths.includes(pathname)) {
				setSessionRedirectUrl(pathname);
			} else if (!isGuest && !ignoredPaths.includes(pathname)) {
				/**
				 * If user is member but don't have permission to view the route
				 * redirected to main route '/'
				 */
				if (isOnlyGuestAllowed) {
					setSessionRedirectUrl('/');
				} else {
					setSessionRedirectUrl('/401');
				}
			}
		}

		handleRedirection();
	}, [auth, userRole, isGuest, pathname, handleRedirection, status, navigate, user]);

	// Return children if access is granted, otherwise null
	return accessGranted ? children : <FuseLoading />;
}

export default AuthGuardRedirect;
