'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import CreditTermsManagement from './CreditTermsManagement';

/**
 * Credit Terms Management Page
 * Only accessible by suppliers
 */
function CreditTermsPage() {
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
        
        // Check if user is supplier or admin
        const isSupplier = roles.includes('supplier');
        const isAdmin = roles.includes('admin');
        
        if (!isSupplier && !isAdmin) {
            // Redirect non-suppliers
            router.push('/dashboards/seller');
        }
    }, [session, status, router]);
    
    if (status === 'loading') {
        return null;
    }
    
    const user = session?.user || session?.db;
    const userRoles = user?.role || session?.db?.role || [];
    const roles = Array.isArray(userRoles) ? userRoles : [userRoles];
    const isSupplier = roles.includes('supplier');
    const isAdmin = roles.includes('admin');
    
    if (!isSupplier && !isAdmin) {
        return null;
    }
    
    return <CreditTermsManagement />;
}

export default CreditTermsPage;

