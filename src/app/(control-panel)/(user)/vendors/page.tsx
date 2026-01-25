import vendors from './vendors';
import AuthGuard from '@auth/AuthGuard';
import authRoles from '@auth/authRoles';

const vendorsPage = () => {
    return (
        <AuthGuard auth={authRoles.admin} mode="inline">
            <vendors />
        </AuthGuard>
    );
};

export default vendorsPage;