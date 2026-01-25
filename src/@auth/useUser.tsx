import { useSession, signOut } from 'next-auth/react';
import { useMemo } from 'react';
import { User } from '@auth/user';
import { authUpdateDbUser, authUserSignOut } from '@auth/authApi';
import _ from 'lodash';
import setIn from '@/utils/setIn';

type useUser = {
	data: User | null;
	isGuest: boolean;
	updateUser: (updates: Partial<User>) => Promise<User | undefined>;
	updateUserSettings: (newSettings: User['settings']) => Promise<User['settings'] | undefined>;
	signOut: () => Promise<void>;
};

function useUser(): useUser {
	const { data, update } = useSession();
	const user = useMemo(() => {
		console.log('useUser - Session data:', data);
		console.log('useUser - Extracted user (data.db):', data?.db);
		return data?.db;
	}, [data]);
	const isGuest = useMemo(() => {
		const guestStatus = !user?.role || user?.role?.length === 0;
		console.log('useUser - Guest status:', guestStatus, 'User role:', user?.role);
		return guestStatus;
	}, [user]);

	/**
	 * Update user
	 * Uses current auth provider's updateUser method
	 */
	async function handleUpdateUser(_data: Partial<User>) {
		const response = await authUpdateDbUser(_data);

		if (!response.ok) {
			throw new Error('Failed to update user');
		}

		const updatedUser = (await response.json()) as User;

		// Update AuthJs session data
		setTimeout(() => {
			update();
		}, 300);

		return updatedUser;
	}

	/**
	 * Update user settings
	 * Uses current auth provider's updateUser method
	 */
	async function handleUpdateUserSettings(newSettings: User['settings']) {
		const newUser = setIn(user, 'settings', newSettings) as User;

		if (_.isEqual(user, newUser)) {
			return undefined;
		}

		const updatedUser = await handleUpdateUser(newUser);

		return updatedUser?.settings;
	}

	/**
	 * Sign out
	 */
	// async function handleSignOut() {
	// 	console.log('SignOut Call');
	// 	// return;
	// 	return signOut();
	// }

	/**
 * Sign out
 */
	async function handleSignOut() {
		try {
			// Get the accessAuthToken from the session
			const accessAuthToken = data?.accessAuthToken;

			if (!accessAuthToken) {
				throw new Error('No access token available for logout');
			}

			// Call the Laravel logout endpoint
			const response = await authUserSignOut(accessAuthToken);

			if (!response.ok) {
				throw new Error('Failed to log out from backend');
			}

			console.log('Logout successful');

			// Clear auth_token from localStorage (if used)
			// localStorage.removeItem('auth_token');

			// Call NextAuth signOut to terminate the session
			// return signOut();
			await signOut({ redirect: false }); // Prevent default redirect to handle it manually

			// Redirect to sign-in page
			window.location.href = '/sign-in';
		} catch (err) {
			console.error('Logout failed:', err);
			// Optionally handle the error (e.g., show a message to the user)
			throw err; // Re-throw to allow the caller to handle the error if needed
		}
	}

	return {
		data: user,
		isGuest,
		signOut: handleSignOut,
		updateUser: handleUpdateUser,
		updateUserSettings: handleUpdateUserSettings
	};
}

export default useUser;
