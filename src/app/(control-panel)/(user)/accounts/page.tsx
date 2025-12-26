import Users from './Users';
import AuthGuard from '@auth/AuthGuard';
import authRoles from '@auth/authRoles';

const UsersPage = () => {
    return (
        <AuthGuard auth={authRoles.admin} mode="inline">
            <Users />
        </AuthGuard>
    );
};

export default UsersPage;