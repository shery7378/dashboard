'use client';

import { useMemo } from 'react';
import { type MRT_ColumnDef } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
import { ListItemIcon, MenuItem, Paper, Typography, Button, Avatar } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import {
	useGetProfilesByRoleQuery,
	useDeleteProfileMutation,
	useResetUserPasswordMutation,
	type Profile
} from '@/app/(control-panel)/(user)/accounts/apis/ProfileApi';
import { ConfirmDialog, SuccessDialog } from '@/components/DialogComponents';
import Link from '@fuse/core/Link';
import { useAdminTable } from '@/hooks/useAdminTable';
import { formatDate, formatImageUrl } from '@/utils/Constants';

/**
 * Table showing all Vendors/Sellers.
 */
function SellersTable() {
	const [deleteProfile] = useDeleteProfileMutation();
	const [resetUserPassword] = useResetUserPasswordMutation();

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
		entityName: 'Vendor',
	});

	const { data: profilesRes, isLoading, error } = useGetProfilesByRoleQuery({
		role: 'vendor',
		page: pagination.pageIndex + 1,
		perPage: pagination.pageSize,
	});

	const profiles = profilesRes?.data ?? [];

	const columns = useMemo<MRT_ColumnDef<Profile>[]>(() => [
		{
			accessorKey: 'image',
			header: 'Image',
			enableSorting: false,
			size: 64,
			Cell: ({ row }) => (
				<Avatar
					variant="rounded"
					src={formatImageUrl(row.original.image)}
					alt={row.original.user?.name || 'Vendor'}
					sx={{ width: 44, height: 44, borderRadius: 1 }}
				/>
			),
		},
		{
			accessorKey: 'user.name',
			header: 'Seller Name',
			Cell: ({ row }) => (
				<Typography 
					component={Link} 
					to={`/accounts/${row.original?.user?.id}`} 
					className="font-semibold hover:underline decoration-secondary"
				>
					{row.original.user?.name}
				</Typography>
			),
		},
		{
			id: 'full_name',
			header: 'Full Name',
			accessorFn: (row) => `${row.first_name || ''} ${row.last_name || ''}`,
			Cell: ({ row }) => <span className="font-medium text-text-primary">{row.original.first_name} {row.original.last_name}</span>,
		},
		{
			id: 'roles',
			header: 'Role',
			accessorFn: (row) => row.user?.roles?.join(', '),
			Cell: ({ row }) => (
				<Typography className="text-12 bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-medium">
					{row.original.user?.roles?.join(', ') || 'Vendor'}
				</Typography>
			),
		},
		{ accessorKey: 'user.email', header: 'Email' },
		{
			accessorKey: 'phone',
			header: 'Phone',
			Cell: ({ row }) => row.original.phone ?? '—',
		},
		{
			accessorKey: 'company_name',
			header: 'Company',
			Cell: ({ row }) => row.original.company_name ?? '—',
		},
		{
			accessorKey: 'country',
			header: 'Country',
			Cell: ({ row }) => row.original.country ?? '—',
		},
		{
			accessorKey: 'status',
			header: 'Status',
			Cell: ({ row }) => (
				<Typography 
					className={`text-12 font-bold px-2 py-0.5 rounded ${row.original.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}
				>
					{row.original.status ?? '—'}
				</Typography>
			),
		},
		{
			accessorKey: 'created_at',
			header: 'Created At',
			Cell: ({ row }) => formatDate(row.original.created_at),
		},
	], []);

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
		</MenuItem>,
	], [openDeleteDialog]);

	const renderTopToolbarCustomActions = useMemo(() => ({ table }: any) => {
		const { rowSelection } = table.getState();
		if (Object.keys(rowSelection).length === 0) return null;

		return (
			<Button
				variant="contained"
				size="small"
				onClick={() => openDeleteDialog(table.getSelectedRowModel().rows.map((r: any) => r.original.id), table)}
				className="flex shrink min-w-9"
				color="error"
				startIcon={<FuseSvgIcon size={16}>heroicons-outline:trash</FuseSvgIcon>}
			>
				Delete selected items
			</Button>
		);
	}, [openDeleteDialog]);

	if (error) return (
		<Paper className="p-24 flex flex-col items-center justify-center shadow-1 rounded-lg">
			<Typography color="error" variant="body1" className="font-semibold text-20">Failed to load Vendors</Typography>
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

export default SellersTable;