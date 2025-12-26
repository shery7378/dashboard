import AuthGuard from '@auth/AuthGuard';
import Stores from './Stores';
import authRoles from '@auth/authRoles';

const StoresPage = () => {
    return (
        <AuthGuard auth={authRoles.admin} mode="inline">
            <Stores />
        </AuthGuard>
    );
};

export default StoresPage;
