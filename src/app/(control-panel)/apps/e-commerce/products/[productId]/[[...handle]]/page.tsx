import AuthGuard from '@auth/AuthGuard';
import Product from './Product';

const ProductPage = () => {
	return (
		<AuthGuard from="addProduct">
			<Product />
		</AuthGuard>
	);
};

export default ProductPage;
