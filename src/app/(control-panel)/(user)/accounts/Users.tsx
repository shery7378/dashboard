'use client';

import PageHeader from '@/components/PageHeader';
import UsersTable from './UsersTable';

/**
 * The users management page.
 */
function Users() {
	return (
		<div className="w-full h-full flex flex-col">
			<PageHeader 
				title="Users" 
				subtitle="Manage user accounts, roles and permissions"
				actions={[
					{
						label: 'Add User',
						link: '/accounts/new',
						icon: 'heroicons-outline:plus-circle',
						color: 'primary'
					}
				]}
			/>
			<div className="flex-auto p-24 pt-0">
				<UsersTable />
			</div>
		</div>
	);
}

export default Users;

