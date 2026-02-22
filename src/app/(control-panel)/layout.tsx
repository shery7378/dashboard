import MainLayout from 'src/components/MainLayout';
import AuthGuardRedirect from '@auth/AuthGuardRedirect';
import StoreNavigationManager from '@/components/theme-layouts/components/StoreNavigationManager';
import authRoles from '@auth/authRoles';

function Layout({ children }) {
	// Allow admin, vendor, and supplier roles
	const allowedRoles = [...authRoles.admin, ...authRoles.vendor, ...authRoles.supplier];

	return (
		<AuthGuardRedirect auth={allowedRoles}>
			<StoreNavigationManager />
			<MainLayout>{children}</MainLayout>
		</AuthGuardRedirect>
	);
}

export default Layout;
