import Vendors from './Vendors';
import AuthGuard from '@auth/AuthGuard';
import authRoles from '@auth/authRoles';

const VendorsPage = () => {
    return (
        <AuthGuard auth={authRoles.admin} mode="inline">
            <Vendors />
        </AuthGuard>
    );
};

export default VendorsPage;