'use client';

import GlobalStyles from '@mui/material/GlobalStyles';
import CategoriesHeader from './CategoriesHeader';
import CategoriesTable from './CategoriesTable';

/**
 * The products page.
 */
function Categories() {
	return (
		<>
			<GlobalStyles
				styles={() => ({
					'#root': {
						maxHeight: '100vh'
					}
				})}
			/>
			<div className="w-full h-full flex flex-col px-4">
				<CategoriesHeader />
				<CategoriesTable />
			</div>
		</>
	);
}

export default Categories;
