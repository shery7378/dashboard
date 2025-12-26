import AuthGuard from '@auth/AuthGuard';
import authRoles from '@auth/authRoles';
import UserPage from './UserPage';

const Page = () => {
    return (
        <AuthGuard auth={['admin']} mode="inline">
            <UserPage />
        </AuthGuard>
    );
};

export default Page;
