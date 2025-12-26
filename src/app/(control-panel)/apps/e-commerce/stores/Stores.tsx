'use client';

import GlobalStyles from '@mui/material/GlobalStyles';
import StoresHeader from './StoresHeader';
import StoresTable from './StoresTable';

/**
 * The products page.
 */
function Stores() {
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
				<StoresHeader />
				<StoresTable />
			</div>
		</>
	);
}

export default Stores;
