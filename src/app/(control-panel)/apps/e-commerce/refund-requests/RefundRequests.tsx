'use client';

import PageHeader from '@/components/PageHeader';
import RefundRequestsTable from './RefundRequestsTable';

/**
 * The refund requests management page.
 */
function RefundRequests() {
	return (
		<div className="w-full h-full flex flex-col">
			<PageHeader 
				title="Refund Requests" 
				subtitle="Manage and process customer refund and return requests"
				actions={[
					{
						label: 'Export CSV',
						icon: 'heroicons-outline:arrow-down-tray',
						color: 'secondary'
					}
				]}
			/>
			<div className="flex-auto p-24 pt-0">
				<RefundRequestsTable />
			</div>
		</div>
	);
}

export default RefundRequests;

