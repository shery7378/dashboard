'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import FuseNavItemModel from '@fuse/core/FuseNavigation/models/FuseNavItemModel';
import { appendNavigationItem, removeNavigationItem } from './navigation/store/navigationSlice'; // Adjust path if needed
import { useAppDispatch } from '@/store/hooks';

function StoreNavigationManager() {
	const dispatch = useAppDispatch();

	// Extend the User type to include db with store_id and role
	type UserWithDb = {
		db?: {
			store_id?: string | number;
			role?: string[];
		};
		[key: string]: any;
	};

	const { data: user, status } = useSession() as {
		data: UserWithDb | null;
		status: string;
	};

	const authUser = user?.db;
	const userRole = authUser?.role || [];
	const storeId = authUser?.store_id || 'new';

	useEffect(() => {
		if (status !== 'authenticated' || !userRole.length) {
			return;
		}

		// Use a unique ID to track if we've already injected these items
		// to avoid redundant Redux churn across re-renders
		const injectionKey = `nav-injected-${authUser?.id || 'guest'}-${storeId}`;
		if ((window as any)[injectionKey]) return;

		// Clean up old items first
		dispatch(removeNavigationItem(`store-new`));
		if (authUser?.store_id) {
			dispatch(removeNavigationItem(`store-${authUser.store_id}`));
		}

		// Inject My Store / Add Store
		dispatch(
			appendNavigationItem(
				FuseNavItemModel({
					id: `store-${storeId}`,
					title: authUser?.store_id ? 'My Store' : 'Add Store',
					icon: 'heroicons-outline:building-storefront',
					url: `/apps/e-commerce/stores/${storeId}`,
					type: 'item',
					auth: userRole,
					end: true
				}),
				'vendor'
			)
		);

		// Inject Account Collapse
		dispatch(
			appendNavigationItem(
				FuseNavItemModel({
					id: 'user-account',
					title: 'Account',
					type: 'collapse',
					icon: 'heroicons-outline:user-circle',
					auth: userRole,
					end: true,
					children: [
						{
							id: 'user-password',
							title: 'Change Password',
							type: 'item',
							url: '/accounts/profile#change-password'
						}
					]
				}),
				'vendor'
			)
		);

		(window as any)[injectionKey] = true;
	}, [status, authUser?.id, storeId, userRole, dispatch]);

	return null;
}

export default StoreNavigationManager;
