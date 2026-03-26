'use client';

import PageHeader from '@/components/PageHeader';
import SellersTable from './SellersTable';

/**
 * The Sellers Page.
 */
function Sellers() {
	return (
		<div className="w-full h-full flex flex-col">
			<PageHeader 
				title="Sellers" 
				actions={[
					{
						label: 'Add',
						href: '/accounts/new',
						icon: 'heroicons-outline:plus',
						color: 'secondary'
					}
				]}
			/>
			<div className="px-4 pb-4 flex-auto overflow-hidden">
				<SellersTable />
			</div>
		</div>
	);
}

export default Sellers;
