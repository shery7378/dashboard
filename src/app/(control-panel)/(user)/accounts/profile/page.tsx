import AuthGuard from '@auth/AuthGuard';
import authRoles from '@auth/authRoles';
import ProfilePage from './ProfilePage';

const Page = () => {
    return (
        <AuthGuard auth={['admin', 'vendor', 'supplier']} mode="inline">
            <ProfilePage />
        </AuthGuard>
    );
};

export default Page;
