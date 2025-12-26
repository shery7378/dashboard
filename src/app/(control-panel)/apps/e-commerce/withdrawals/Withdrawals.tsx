'use client';

import GlobalStyles from '@mui/material/GlobalStyles';
import WithdrawalsHeader from './WithdrawalsHeader';
import WithdrawalsTable from './WithdrawalsTable';

/**
 * The withdrawals management page.
 */
function Withdrawals() {
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
				<WithdrawalsHeader />
				<WithdrawalsTable />
			</div>
		</>
	);
}

export default Withdrawals;

