import AuthGuard from '@auth/AuthGuard';
import Product from './Product';
import authRoles from '@auth/authRoles';

const ProductPage = () => {
    return (
        <AuthGuard from="addProduct">
            <Product />
        </AuthGuard>
    );
};

export default ProductPage;
