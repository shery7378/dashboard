'use client';

import PageHeader from '@/components/PageHeader';
import StoresTable from './StoresTable';
import useUser from '@auth/useUser';

/**
 * The Stores Page. Shows list of stores for admins.
 */
function Stores() {
	const { data: user } = useUser();
	
	const userRole = user?.role || [];
	const roles = Array.isArray(userRole) ? userRole : [userRole];
	const isAdmin = roles.includes('admin');

	return (
		<div className="w-full h-full flex flex-col">
			<PageHeader 
				title="Stores" 
				actions={isAdmin ? [
					{
						label: 'Add Store',
						href: '/apps/e-commerce/stores/new',
						icon: 'heroicons-outline:plus',
						color: 'primary'
					}
				] : undefined}
			/>
			<div className="px-4 pb-4 flex-auto overflow-hidden">
				<StoresTable />
			</div>
		</div>
	);
}

export default Stores;
