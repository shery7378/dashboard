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

	// If user has store_id use it, otherwise "new"
	const hasStore = Boolean(user?.db?.store_id);
	const storeId = hasStore ? user.db.store_id : 'new';

	useEffect(() => {
		if (status === 'authenticated' && user?.db?.role) {
			const userRole = user.db.role || [];

			// Remove potential old items to prevent duplicates
			dispatch(removeNavigationItem(`store-new`));

			if (user?.db?.store_id) {
				dispatch(removeNavigationItem(`store-${user.db.store_id}`));
			}

			if (userRole.includes('vendor') || userRole.includes('supplier')) {
				dispatch(removeNavigationItem(`e-commerce-stores`));
			}

			// Define nav items dynamically
			const navItems = [
				{
					id: `store-${storeId}`,
					title: hasStore ? 'My Store' : 'Add Store',
					icon: 'heroicons-outline:building-storefront',
					url: `/apps/e-commerce/stores/${storeId}`
				}
				// {
				//   id: `store-orders`,
				//   title: 'Store Orders',
				//   url: `/apps/e-commerce/stores/${storeId}/orders`,
				// },
				// {
				//   id: `store-products`,
				//   title: 'Store Products',
				//   url: `/apps/e-commerce/stores/${storeId}/products`,
				// },
			];
			const accountItems = [
				{
					id: 'user-account',
					title: 'Account',
					type: 'collapse',
					icon: 'heroicons-outline:user-circle',
					children: [
						// {
						//   id: 'user-profile',
						//   title: 'Profile',
						//   type: 'item',
						//   url: '/accounts/profile',
						//   end: true
						// },
						{
							id: 'user-password',
							title: 'Change Password',
							type: 'item',
							url: '/accounts/profile#change-password'
							// auth: authRoles.admin,
						}
					]
				}
			];

			// Inject nav items
			navItems.forEach((item) => {
				dispatch(
					appendNavigationItem(
						FuseNavItemModel({
							...item,
							type: 'item',
							auth: userRole,
							end: true
						}),
						'vendor'
					)
				);
			});

			accountItems.forEach((item) => {
				dispatch(
					appendNavigationItem(
						FuseNavItemModel({
							...item,
							type: 'collapse',
							auth: userRole,
							end: true
						}),
						'vendor'
					)
				);
			});

			if (userRole.includes('admin')) {
				dispatch(removeNavigationItem(`store-new`));
				dispatch(removeNavigationItem(`store-${user.db.store_id}`));
			}
		}

		// Cleanup on unmount → remove all items
		return () => {
			dispatch(removeNavigationItem(`store-new`));

			if (user?.db?.store_id) {
				dispatch(removeNavigationItem(`store-${user.db.store_id}`));
			}

			// dispatch(removeNavigationItem('store-orders'));
			// dispatch(removeNavigationItem('store-products'));
		};
	}, [status, user, dispatch, storeId, hasStore]);

	return null;
}

export default StoreNavigationManager;
