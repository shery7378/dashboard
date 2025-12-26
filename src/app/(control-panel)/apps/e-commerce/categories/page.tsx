import AuthGuard from '@auth/AuthGuard';
import Categories from './Categories';
import authRoles from '@auth/authRoles';

const CategoriesPage = () => {
    return (
        <AuthGuard mode="inline">
            <Categories />
        </AuthGuard>
    );
};

export default CategoriesPage;
