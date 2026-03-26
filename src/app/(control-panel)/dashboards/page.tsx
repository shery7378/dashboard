import { redirect } from 'next/navigation';
import { auth } from '@/@auth/authJs';

export default async function DashboardsPage() {
	// Check session once without artificial delays
	const session = await auth();

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
