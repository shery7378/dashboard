'use client';

import PageHeader from '@/components/PageHeader';
import OrdersTable from './OrdersTable';

/**
 * The e-commerce orders management page.
 */
function Orders() {
	return (
		<div className="w-full h-full flex flex-col">
			<PageHeader 
				title="Orders" 
				subtitle="Manage and track customer orders across all stores"
				actions={[
					{
						label: 'Export Orders',
						icon: 'heroicons-outline:arrow-down-tray',
						color: 'secondary'
					}
				]}
			/>
			<div className="flex-auto p-24 pt-0">
				<OrdersTable />
			</div>
		</div>
	);
}

export default Orders;

