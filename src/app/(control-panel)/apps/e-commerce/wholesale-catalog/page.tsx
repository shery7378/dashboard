'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import WholesaleCatalog from './WholesaleCatalog';

/**
 * Wholesale Catalog Page
 * Only accessible by vendors
 */
function WholesaleCatalogPage() {
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            router.push('/sign-in');
            return;
        }

        const user = session?.user || session?.db;
        const userRoles = user?.role || session?.db?.role || [];
        const roles = Array.isArray(userRoles) ? userRoles : [userRoles];

        // Check if user is vendor or admin
        const isvendor = roles.includes('vendor');
        const isAdmin = roles.includes('admin');

        if (!isvendor && !isAdmin) {
            // Redirect non-vendors to their dashboard
            // If supplier, go to supplier dashboard
            if (roles.includes('supplier')) {
                router.push('/dashboards/supplier');
            } else {
                router.push('/dashboards/seller');
            }
        }
    }, [session, status, router]);

    if (status === 'loading') {
        return null; // Or a loading spinner
    }

    const user = session?.user || session?.db;
    const userRoles = user?.role || session?.db?.role || [];
    const roles = Array.isArray(userRoles) ? userRoles : [userRoles];
    const isvendor = roles.includes('vendor');
    const isAdmin = roles.includes('admin');

    if (!isvendor && !isAdmin) {
        return null; // Will redirect
    }

    return <WholesaleCatalog />;
}

export default WholesaleCatalogPage;

