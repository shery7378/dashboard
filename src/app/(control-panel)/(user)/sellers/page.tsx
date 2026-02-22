import Sellers from './Sellers';
import AuthGuard from '@auth/AuthGuard';
import authRoles from '@auth/authRoles';

const sellersPage = () => {
	return (
		<AuthGuard
			auth={authRoles.admin}
			mode="inline"
		>
			<Sellers />
		</AuthGuard>
	);
};

export default sellersPage;
