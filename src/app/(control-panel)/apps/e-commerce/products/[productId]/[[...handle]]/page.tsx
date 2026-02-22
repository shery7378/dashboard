import AuthGuard from '@auth/AuthGuard';
import authRoles from '@auth/authRoles';
import Product from './Product';

const ProductPage = () => {
	return (
		<AuthGuard 
			auth={[...authRoles.admin, ...authRoles.vendor, ...authRoles.supplier]}
			from="addProduct"
		>
			<Product />
		</AuthGuard>
	);
};

export default ProductPage;
