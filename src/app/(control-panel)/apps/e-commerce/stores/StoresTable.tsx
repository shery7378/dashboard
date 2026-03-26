'use client';

import { useEffect, useMemo } from 'react';
import { type MRT_ColumnDef } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
import { Avatar, Button, ListItemIcon, MenuItem, Paper, Typography } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Link from '@fuse/core/Link';
import { EcommerceStore, useGetECommerceStoresQuery, useDeleteECommerceStoreMutation } from '../apis/StoresLaravelApi';
import useUser from '@auth/useUser';
import useNavigate from '@fuse/hooks/useNavigate';
import { ConfirmDialog, SuccessDialog } from '@/components/DialogComponents';
import { useAdminTable } from '@/hooks/useAdminTable';
import { formatDate, formatImageUrl } from '@/utils/Constants';

/**
 * Table showing all e-commerce stores.
 */
function StoresTable() {
	const { data: user } = useUser();
	const navigate = useNavigate();

	const userRole = useMemo(() => {
		const role = user?.role;
		if (!role) return [];
		return Array.isArray(role) ? role : [role];
	}, [user?.role]);

	const isAdmin = userRole.includes('admin');
	const storeId = user?.store_id;

	useEffect(() => {
		if (storeId && !isAdmin) {
			navigate(`/apps/e-commerce/stores/${storeId}`);
		}
	}, [storeId, isAdmin, navigate]);

	const [removeStore] = useDeleteECommerceStoreMutation();

	// Use our optimized hook
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
		deleteMutation: removeStore,
		entityName: 'Store',
	});

	const { data: stores, isLoading, error } = useGetECommerceStoresQuery(
		{ page: pagination.pageIndex + 1, perPage: pagination.pageSize },
		{ refetchOnMountOrArgChange: 300, refetchOnFocus: false, skip: !isAdmin }
	);

	const columns = useMemo<MRT_ColumnDef<EcommerceStore>[]>(() => [
		{
			accessorKey: 'logo',
			header: 'Logo',
			enableSorting: false,
			size: 64,
			Cell: ({ row }) => (
				<Avatar
					variant="rounded"
					src={formatImageUrl(row.original.logo)}
					alt={row.original.name || 'No logo'}
					sx={{ width: 44, height: 44, borderRadius: 1 }}
				/>
			),
		},
		{
			accessorKey: 'name',
			header: 'Name',
			Cell: ({ row }) => (
				<Typography 
					component={Link} 
					to={`/apps/e-commerce/stores/${row.original.id}/${row.original.slug}`} 
					className="font-semibold hover:underline decoration-secondary"
				>
					{row.original.name}
				</Typography>
			),
		},
		{ accessorKey: 'slug', header: 'Slug' },
		{ accessorKey: 'products_count', header: 'Total Products', align: 'center' },
		{ accessorKey: 'city', header: 'City' },
		{ accessorKey: 'contact_email', header: 'Email' },
		{
			accessorKey: 'active',
			header: 'Status',
			Cell: ({ row }) => (
				<Typography 
					className={`text-12 font-bold px-2 py-0.5 rounded ${row.original.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
				>
					{row.original.active ? 'Active' : 'Inactive'}
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
				color="error"
				onClick={() => openDeleteDialog(table.getSelectedRowModel().rows.map((r: any) => r.original.id), table)}
				startIcon={<FuseSvgIcon size={16}>heroicons-outline:trash</FuseSvgIcon>}
			>
				Delete selected items
			</Button>
		);
	}, [openDeleteDialog]);

	if (userRole.length === 0 || !isAdmin) return null;

	if (error) return (
		<Paper className="p-24 flex flex-col items-center justify-center shadow-1 rounded-lg">
			<Typography color="error" variant="body1" className="font-semibold text-20">Failed to load stores</Typography>
			<Typography color="text.secondary" variant="body2">Please check your connection or try again later.</Typography>
		</Paper>
	);

	return (
		<Paper className="flex flex-col flex-auto shadow hover:shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden border-1 border-divider" elevation={0}>
			<DataTable
				data={stores?.data ?? []}
				columns={columns}
				manualPagination
				rowCount={stores?.pagination?.total ?? 0}
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

export default StoresTable;