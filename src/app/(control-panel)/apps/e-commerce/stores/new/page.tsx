import AuthGuard from '@auth/AuthGuard';
import authRoles from '@auth/authRoles';
import Store from '../[storeId]/[[...handle]]/Store';

/**
 * Page for creating a new store.
 * Reuses the Store component with storeId="new".
 */
const NewStorePage = () => {
	return (
		<AuthGuard 
			auth={[...authRoles.admin]}
			from="storeCreate"
		>
			<Store />
		</AuthGuard>
	);
};

export default NewStorePage;
