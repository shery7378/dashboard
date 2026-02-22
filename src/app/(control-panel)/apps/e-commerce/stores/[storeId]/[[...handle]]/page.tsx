import AuthGuard from '@auth/AuthGuard';
import authRoles from '@auth/authRoles';
import Store from './Store';

const StorePage = () => {
	return (
		<AuthGuard 
			auth={[...authRoles.admin, ...authRoles.vendor, ...authRoles.supplier]}
			from="storeEdit"
		>
			<Store />
		</AuthGuard>
	);
};

export default StorePage;
