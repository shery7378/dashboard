import { redirect } from 'next/navigation';
import { auth } from '@/@auth/authJs';

export default async function DashboardsPage() {
    let session = null as any;
    try {
        session = await auth();
    } catch (e) {
        // If session cookie is invalid/corrupted (JWTSessionError), force re-auth
        redirect('/sign-in');
    }

    // If no session, redirect to sign-in
    if (!session || !session.user) {
        redirect('/sign-in');
    }

    // Role array hai, pehla role check karen
    const role = session?.user?.role?.[0];

    if (role === 'admin') {
        redirect('/dashboards/project');
    } else if (role === 'vendor') {
        // Sellers can buy from suppliers (wholesale catalog access)
        redirect('/dashboards/seller');
    } else if (role === 'supplier') {
        // Suppliers use the same dashboard as sellers
        redirect('/dashboards/seller');
    } else {
        redirect('/sign-in');
    }
    return null;
}
