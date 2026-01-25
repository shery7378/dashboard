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

type AuthGuardProps = {
	auth: FuseRouteObjectType['auth'];
	children: React.ReactNode;
	loginRedirectUrl?: string;
};

function AuthGuardRedirect({ auth, children, loginRedirectUrl = '/' }: AuthGuardProps) {
	const { data: user, isGuest } = useUser();
	const userRole = user?.role;
	const navigate = useNavigate();

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
		console.log('AuthGuardRedirect - Checking permissions:', {
			auth,
			userRole,
			isGuest,
			pathname
		});

		const isOnlyGuestAllowed = Array.isArray(auth) && auth.length === 0;
		const userHasPermission = FuseUtils.hasPermission(auth, userRole);
		const ignoredPaths = ['/', '/callback', '/sign-in', '/sign-out', '/logout', '/404'];

		console.log('AuthGuardRedirect - Permission check:', {
			isOnlyGuestAllowed,
			userHasPermission,
			ignoredPaths: ignoredPaths.includes(pathname)
		});

		if (!auth || (auth && userHasPermission) || (isOnlyGuestAllowed && isGuest)) {
			console.log('AuthGuardRedirect - Access granted');
			setAccessGranted(true);
			return;
		}

		if (!userHasPermission) {
			if (isGuest && !ignoredPaths.includes(pathname)) {
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
	}, [auth, userRole, isGuest, pathname, handleRedirection]);

	// Return children if access is granted, otherwise null
	return accessGranted ? children : <FuseLoading />;
}

// the landing page "/" redirected to /example but the example npt

export default AuthGuardRedirect;
