import AuthGuard from '@auth/AuthGuard';
import Categories from './Categories';

const CategoriesPage = () => {
	return (
		<AuthGuard mode="inline">
			<Categories />
		</AuthGuard>
	);
};

export default CategoriesPage;
