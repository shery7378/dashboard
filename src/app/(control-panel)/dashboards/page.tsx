import { redirect } from 'next/navigation';
import { auth } from '@/@auth/authJs';

export default async function DashboardsPage() {
    let session = null as any;
    let retryCount = 0;
    const maxRetries = 3;
    
    // Retry session check with small delays to handle timing issues after signup
    while (retryCount < maxRetries && !session) {
        try {
            session = await auth();
            if (session) break;
        } catch (e) {
            // If session cookie is invalid/corrupted (JWTSessionError), try again
            if (retryCount === maxRetries - 1) {
                redirect('/sign-in');
            }
        }
        
        // Small delay before retry (only on server side this won't block)
        await new Promise(resolve => setTimeout(resolve, 100));
        retryCount++;
    }

    // If no session after retries, redirect to sign-in
    if (!session || !session.user) {
        redirect('/sign-in');
    }

    // Role array hai, pehla role check karen
    const role = session?.user?.role?.[0];

    if (role === 'admin') {
        redirect('/dashboards/project');
    } else if (role === 'vendor') {
        // Vendors can buy from suppliers (wholesale catalog access)
        redirect('/dashboards/seller');
    } else if (role === 'supplier') {
        // Suppliers use the same dashboard as sellers
        redirect('/dashboards/supplier');
    } else {
        redirect('/sign-in');
    }
    return null;
}
