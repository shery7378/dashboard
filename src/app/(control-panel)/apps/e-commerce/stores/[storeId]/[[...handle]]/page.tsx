import AuthGuard from '@auth/AuthGuard';
import Store from './Store';

const StorePage = () => {
    return (
        <AuthGuard >
            <Store />
        </AuthGuard>
    );
};

export default StorePage;