'use client';

import GlobalStyles from '@mui/material/GlobalStyles';
import RefundRequestsHeader from './RefundRequestsHeader';
import RefundRequestsTable from './RefundRequestsTable';

/**
 * The refund requests management page.
 */
function RefundRequests() {
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
				<RefundRequestsHeader />
				<RefundRequestsTable />
			</div>
		</>
	);
}

export default RefundRequests;
