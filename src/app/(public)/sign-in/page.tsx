'use client';

import authRoles from '@auth/authRoles';
import AuthGuardRedirect from '@auth/AuthGuardRedirect';
import SignInPage from './SignInPage';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

function Page() {

	const { data: session, status } = useSession();

	useEffect(() => {
		console.log('SESSION', session, status);
	}, [session]);

	return (
		<AuthGuardRedirect auth={authRoles.onlyGuest}>
			<SignInPage />
		</AuthGuardRedirect>
	);
}

export default Page;
