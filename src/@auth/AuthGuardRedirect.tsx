'use client';
//src/@auth/AuthGuardRedirect.txs
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
			console.log('AuthGuardRedirect - Session loading, waiting...');
			return;
		}

		console.log('AuthGuardRedirect - Checking permissions:', {
			auth,
			userRole,
			isGuest,
			pathname,
			status
		});

		const isOnlyGuestAllowed = Array.isArray(auth) && auth.length === 0;
		const userHasPermission = FuseUtils.hasPermission(auth, userRole);
		const ignoredPaths = ['/', '/callback', '/sign-in', '/sign-up', '/sign-out', '/logout', '/404'];

		console.log('AuthGuardRedirect - Permission check:', {
			isOnlyGuestAllowed,
			userHasPermission,
			ignoredPaths: ignoredPaths.includes(pathname),
			pathname,
			isGuest,
			status
		});

		// If pathname is in ignoredPaths, always grant access (public pages)
		if (ignoredPaths.includes(pathname)) {
			console.log('AuthGuardRedirect - Public page, access granted');
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
				console.log('AuthGuardRedirect - Guest page, guest user - access granted');
				setAccessGranted(true);
				resetSessionRedirectUrl();
				return;
			} else {
				// Authenticated user trying to access guest-only page (like signup/signin)
				// Redirect them to dashboard/home
				console.log('AuthGuardRedirect - Authenticated user on guest page, redirecting to home');
				navigate('/');
				return;
			}
		}

		// If user has permission, grant access and clear any existing redirect URL
		if (!auth || (auth && userHasPermission)) {
			console.log('AuthGuardRedirect - Access granted');
			setAccessGranted(true);
			// Clear any existing redirect URL since user can access this page
			resetSessionRedirectUrl();
			return;
		}

		if (!userHasPermission) {
			if ((isGuest || status === 'unauthenticated') && !ignoredPaths.includes(pathname)) {
				console.log('AuthGuardRedirect - Guest user, setting redirect URL');
				setSessionRedirectUrl(pathname);
			} else if (!isGuest && !ignoredPaths.includes(pathname)) {
				console.log('AuthGuardRedirect - User without permission, redirecting to 401');

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

		console.log('AuthGuardRedirect - Calling handleRedirection');
		handleRedirection();
	}, [auth, userRole, isGuest, pathname, handleRedirection, status]);

	// Return children if access is granted, otherwise null
	return accessGranted ? children : <FuseLoading />;
}

// the landing page "/" redirected to /example but the example npt

export default AuthGuardRedirect;
