'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AuthGuard from '@auth/AuthGuard';
import authRoles from '@auth/authRoles';
import FuseLoading from '@fuse/core/FuseLoading';
import { useGetCurrentUserStoreQuery } from '../apis/StoresLaravelApi';

/**
 * Redirect page that takes vendors/suppliers to their store settings
 */
const MyStorePageContent = () => {
	const router = useRouter();
	const { data: session, status } = useSession();
	const { data: storeData, isLoading: isStoreLoading } = useGetCurrentUserStoreQuery();

	useEffect(() => {
		if (status === 'loading' || isStoreLoading) return;

		if (status === 'authenticated') {
			console.log('=== MyStorePage Debug ===');
			console.log('Full Session:', session);
			
			// Try to get storeId from session first
			const sessionStoreId = 
				session?.db?.store_id ||
				session?.db?.storeId ||
				(session?.db as any)?.stores?.[0]?.id ||
				(session?.db as any)?.stores?.[0]?.store_id ||
				session?.user?.store_id;
			
			// Use storeData from API as fallback
			const apiStoreId = storeData?.data?.id;
			
			const storeId = sessionStoreId || apiStoreId;
			
			console.log('Session StoreID:', sessionStoreId);
			console.log('API StoreID:', apiStoreId);
			console.log('Final StoreID:', storeId);
			
			if (storeId) {
				console.log('✅ Redirecting to store:', `/apps/e-commerce/stores/${storeId}`);
				router.push(`/apps/e-commerce/stores/${storeId}`);
			} else {
				console.log('❌ No store ID found, redirecting to create new store');
				router.push('/apps/e-commerce/stores/new');
			}
		}
	}, [status, session, storeData, isStoreLoading, router]);

	// Show loading while we determine the user and their store
	return <FuseLoading />;
};

const MyStorePage = () => {
	return (
		<AuthGuard 
			auth={[...authRoles.vendor, ...authRoles.supplier]}
			from="myStore"
		>
			<MyStorePageContent />
		</AuthGuard>
	);
};

export default MyStorePage;
