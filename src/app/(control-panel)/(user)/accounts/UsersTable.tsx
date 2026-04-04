'use client';

import { useMemo } from 'react';
import { type MRT_ColumnDef } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
import { ListItemIcon, MenuItem, Paper, Typography, Button, Avatar, Chip } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Link from '@fuse/core/Link';
import {
	useGetProfilesQuery,
	useDeleteProfileMutation,
	type Profile
} from '@/app/(control-panel)/(user)/accounts/apis/ProfileApi';
import { ConfirmDialog, SuccessDialog } from '@/components/DialogComponents';
import { useAdminTable } from '@/hooks/useAdminTable';
import { formatDate, formatImageUrl } from '@/utils/Constants';

/**
 * Table showing user profiles with their roles and contact information.
 */
function UsersTable() {
	const [deleteProfile] = useDeleteProfileMutation();

	const {
		pagination,
		setPagination,
		confirmDialogOpen,
		isDeleting,
		handleCloseSuccessDialog,
		handleCloseConfirmDialog,
		handleRemoveConfirmed,
		openDeleteDialog,
		successDialogOpen,
		successMessage,
	} = useAdminTable({
		deleteMutation: deleteProfile,
		entityName: 'User',
	});

	const {
		data: profilesRes,
		isLoading,
		error
	} = useGetProfilesQuery({
		page: pagination.pageIndex + 1,
		perPage: pagination.pageSize
	});

	const profiles = profilesRes?.data ?? [];

	const columns = useMemo<MRT_ColumnDef<Profile>[]>(
		() => [
			{
				accessorKey: 'image',
				header: 'Image',
				enableSorting: false,
				size: 64,
				Cell: ({ row }) => (
					<Avatar
						variant="rounded"
						src={formatImageUrl(row.original.image)}
						alt={row.original.user?.name || 'User'}
						sx={{ width: 44, height: 44, borderRadius: 1 }}
					/>
				)
			},
			{
				accessorKey: 'user.name',
				header: 'User Name',
				Cell: ({ row }) => (
					<Typography
						component={Link}
						to={`/accounts/${row.original?.user?.id}`}
						className="font-semibold hover:underline decoration-secondary"
					>
						{row.original.user?.name}
					</Typography>
				)
			},
			{
				id: 'full_name',
				header: 'Full Name',
				accessorFn: (row) => `${row.first_name} ${row.last_name}`,
				Cell: ({ row }) => (
					<Typography variant="body2" className="font-medium">
						{row.original.first_name} {row.original.last_name}
					</Typography>
				)
			},
			{
				id: 'roles',
				header: 'Roles',
				accessorFn: (row) => row.user?.roles?.map(r => r === 'vendor' ? 'seller' : r).join(', '),
				Cell: ({ row }) => {
					const roles = row.original.user?.roles;
					if (!roles || roles.length === 0) return <span className="text-gray-400">—</span>;
					return (
						<div className="flex flex-wrap gap-4">
							{roles.map((role) => (
								<Chip
									key={role}
									label={role === 'vendor' ? 'seller' : role}
									size="small"
									className="bg-primary/10 text-primary font-bold text-10 uppercase tracking-widest"
								/>
							))}
						</div>
					);
				}
			},
			{
				accessorKey: 'user.email',
				header: 'Email'
			},
			{
				accessorKey: 'phone',
				header: 'Phone',
				Cell: ({ row }) => row.original.phone || <span className="text-gray-400">—</span>
			},
			{
				accessorKey: 'status',
				header: 'Status',
				Cell: ({ row }) => {
					const status = row.original.status?.toLowerCase();
					const isSuccess = status === 'active' || status === 'verified';
					const isError = status === 'inactive' || status === 'blocked';
					return (
						<Typography
							className={`text-11 font-bold px-2 py-0.5 rounded inline-block uppercase tracking-wider ${
								isSuccess ? 'bg-green-100 text-green-700' : isError ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
							}`}
						>
							{row.original.status || 'Unknown'}
						</Typography>
					);
				}
			},
			{
				accessorKey: 'created_at',
				header: 'Created At',
				Cell: ({ row }) => formatDate(row.original.created_at)
			}
		],
		[]
	);

	const renderRowActionMenuItems = useMemo(() => ({ closeMenu, row, table }: any) => [
		<MenuItem
			key="delete"
			onClick={() => {
				openDeleteDialog([row.original.id], table);
				closeMenu();
			}}
			className="text-error"
		>
			<ListItemIcon>
				<FuseSvgIcon color="error">heroicons-outline:trash</FuseSvgIcon>
			</ListItemIcon>
			Delete
		</MenuItem>
	], [openDeleteDialog]);

	const renderTopToolbarCustomActions = useMemo(() => ({ table }: any) => {
		const { rowSelection } = table.getState();
		if (Object.keys(rowSelection).length === 0) return null;

		return (
			<Button
				variant="contained"
				size="small"
				color="error"
				onClick={() => openDeleteDialog(table.getSelectedRowModel().flatRows.map((r) => r.original.id), table)}
				startIcon={<FuseSvgIcon size={16}>heroicons-outline:trash</FuseSvgIcon>}
			>
				Delete selected users
			</Button>
		);
	}, [openDeleteDialog]);

	if (error) return (
		<Paper className="p-24 flex flex-col items-center justify-center shadow-1 rounded-lg">
			<Typography color="error" variant="body1" className="font-semibold text-20">Failed to load users</Typography>
			<Typography color="text.secondary" variant="body2">Please check your connection or try again later.</Typography>
		</Paper>
	);

	return (
		<Paper className="flex flex-col flex-auto shadow hover:shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden border-1 border-divider" elevation={0}>
			<DataTable
				data={profiles}
				columns={columns}
				manualPagination
				rowCount={profilesRes?.pagination.total ?? 0}
				state={{ pagination, isLoading }}
				onPaginationChange={setPagination}
				renderRowActionMenuItems={renderRowActionMenuItems}
				renderTopToolbarCustomActions={renderTopToolbarCustomActions}
			/>

			<SuccessDialog open={successDialogOpen} onClose={handleCloseSuccessDialog} message={successMessage} />
			<ConfirmDialog open={confirmDialogOpen} onClose={handleCloseConfirmDialog} onConfirm={handleRemoveConfirmed} isDeleting={isDeleting} />
		</Paper>
	);
}

export default UsersTable;

