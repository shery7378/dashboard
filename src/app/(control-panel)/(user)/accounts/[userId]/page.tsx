import AuthGuard from '@auth/AuthGuard';
import UserPage from './UserPage';

const Page = () => {
	return (
		<AuthGuard
			auth={['admin']}
			mode="inline"
		>
			<UserPage />
		</AuthGuard>
	);
};

export default Page;
