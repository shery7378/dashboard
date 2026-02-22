'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import FuseLoading from '@fuse/core/FuseLoading';
import WholesaleOrdersManagement from './WholesaleOrdersManagement';

/**
 * Wholesale Orders Page
 * Only accessible to suppliers
 */
export default function WholesaleOrdersPage() {
	const { data: session, status } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (status === 'loading') return;

		if (!session) {
			router.push('/sign-in');
			return;
		}

		// Check if user is supplier or admin
		const userRoles = session?.user?.roles || [];
		const isSupplier = userRoles.includes('supplier');
		const isAdmin = userRoles.includes('admin');

		if (!isSupplier && !isAdmin) {
			router.push('/dashboards/seller');
		}
	}, [session, status, router]);

	if (status === 'loading') {
		return <FuseLoading />;
	}

	const userRoles = session?.user?.roles || [];
	const isSupplier = userRoles.includes('supplier');
	const isAdmin = userRoles.includes('admin');

	if (!isSupplier && !isAdmin) {
		return null;
	}

	return <WholesaleOrdersManagement />;
}
