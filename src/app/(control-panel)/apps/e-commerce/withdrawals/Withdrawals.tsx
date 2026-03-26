'use client';

import PageHeader from '@/components/PageHeader';
import WithdrawalsTable from './WithdrawalsTable';

/**
 * The withdrawals management page for sellers.
 */
function Withdrawals() {
	return (
		<div className="w-full h-full flex flex-col">
			<PageHeader 
				title="Withdrawals" 
				subtitle="Manage and process seller withdrawal requests"
				actions={[
					{
						label: 'Export Requests',
						icon: 'heroicons-outline:arrow-down-tray',
						color: 'secondary'
					}
				]}
			/>
			<div className="flex-auto p-24 pt-0">
				<WithdrawalsTable />
			</div>
		</div>
	);
}

export default Withdrawals;

