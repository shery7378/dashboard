'use client';

import { useEffect, useMemo, useState } from 'react';
import { type MRT_ColumnDef, type MRT_TableInstance } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
// import FuseLoading from '@fuse/core/FuseLoading';
import { Avatar, Button, ListItemIcon, MenuItem, Paper, Typography } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Link from '@fuse/core/Link';
import { EcommerceStore, useGetECommerceStoresQuery, useDeleteECommerceStoreMutation } from '../apis/StoresLaravelApi';
import { useIsMounted } from 'src/hooks/useIsMounted';
import useUser from '@auth/useUser';
import useNavigate from '@fuse/hooks/useNavigate';
import { ConfirmDialog, SuccessDialog } from '@/components/DialogComponents';
import { useSnackbar } from 'notistack';

/**
 * Store listing table component with actions for view/delete.
 */
function StoresTable() {
	const isMountedRef = useIsMounted();
	const { enqueueSnackbar } = useSnackbar();
	const { data: user, isGuest } = useUser();
	const userRole = useMemo(() => {
		const role = user?.role;
		if (!role) return [];
		return Array.isArray(role) ? role : [role];
	}, [user?.role]);
	const isAdmin = userRole.includes('admin');
	const storeId = user?.store_id;
	const navigate = useNavigate();

	// 🔹 Confirm dialog state
	const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
	const [deleteIds, setDeleteIds] = useState<string[]>([]);
	const [isDeleting, setIsDeleting] = useState(false);
	const [tableInstance, setTableInstance] = useState<MRT_TableInstance<EcommerceStore> | null>(null);

	// 🔹 Success dialog state
	const [successDialogOpen, setSuccessDialogOpen] = useState(false);
	const [successMessage, setSuccessMessage] = useState('');

	// 🔹 Pagination state
	const [pagination, setPagination] = useState({
		pageIndex: 0, // MRT uses 0-based indexing
		pageSize: 10
	});

	// Redirect non-admin users to their store page
	useEffect(() => {
		if (storeId && !isAdmin) {
			navigate(`/apps/e-commerce/stores/${storeId}`);
		}
	}, [storeId, isAdmin, navigate]);

	// If user role is still loading or not admin, don't render the table yet
	if (userRole.length === 0 || !isAdmin) {
		return null;
	}

	// Fetch stores with pagination
	const {
		data: stores,
		isLoading,
		error
	} = useGetECommerceStoresQuery({
		page: pagination.pageIndex + 1,
		perPage: pagination.pageSize
	}, {
		refetchOnMountOrArgChange: 300, // Cache for 5 minutes
		refetchOnFocus: false
	});

	const [removeStore] = useDeleteECommerceStoreMutation();

	// Column definitions
	const columns = useMemo<MRT_ColumnDef<EcommerceStore>[]>(
		() => [
			{
				accessorKey: 'logo',
				header: 'Logo',
				enableSorting: false,
				size: 64,
				Cell: ({ row }) =>
					row.original.logo ? (
						<Avatar
							variant="rounded"
							src={row.original.logo}
							alt={row.original.name}
							sx={{ width: 40, height: 40 }}
						/>
					) : (
						<Avatar
							variant="rounded"
							src="/assets/images/apps/ecommerce/product-image-placeholder.png"
							alt="No logo"
							sx={{ width: 40, height: 40 }}
						/>
					)
			},
			{
				accessorKey: 'name',
				header: 'Name',
				Cell: ({ row }) => (
					<Typography
						component={Link}
						to={`/apps/e-commerce/stores/${row.original.id}/${row.original.slug}`}
						role="button"
					>
						<u>{row.original.name}</u>
					</Typography>
				)
			},
			{
				accessorKey: 'slug',
				header: 'Slug'
			},
			{
				accessorKey: 'products_count',
				header: 'Total Products'
			},
			{
				accessorKey: 'city',
				header: 'City'
			},
			{
				accessorKey: 'country',
				header: 'Country'
			},
			{
				accessorKey: 'contact_email',
				header: 'Email'
			},
			{
				accessorKey: 'active',
				header: 'Status',
				Cell: ({ row }) =>
					row.original.active ? (
						<Typography color="green">Active</Typography>
					) : (
						<Typography color="error">Inactive</Typography>
					)
			},
			{
				accessorKey: 'created_at',
				header: 'Created At',
				Cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString()
			}
		],
		[]
	);

	// Log fetch or error events


	// Confirm delete handler
	const handleRemoveConfirmed = async () => {
		setIsDeleting(true);
		try {
			const results = await Promise.allSettled(deleteIds.map((id) => removeStore(id)));

			const succeeded = results.filter((r) => r.status === 'fulfilled').length;
			const failed = results.filter((r) => r.status === 'rejected').length;

			if (succeeded > 0) {
				const message =
					succeeded === 1 ? 'Store deleted successfully' : `${succeeded} stores deleted successfully`;
				enqueueSnackbar(message, { variant: 'success' });
				setSuccessMessage(message);
				setSuccessDialogOpen(true);

				if (isMountedRef.current && tableInstance) {
					tableInstance.resetRowSelection();
				}
			}

			if (failed > 0) {
				enqueueSnackbar(`${failed} deletion(s) failed`, { variant: 'error' });
			}
		} finally {
			if (isMountedRef.current) {
				setIsDeleting(false);
				setConfirmDialogOpen(false);
				setDeleteIds([]);
				setTableInstance(null);
			}
		}
	};

	// 🔹 Handle success dialog close
	const handleCloseSuccessDialog = () => {
		setSuccessDialogOpen(false);
		setSuccessMessage('');
	};

	if (error) return (
		<Paper className="p-24 flex flex-col items-center justify-center shadow-1 rounded-lg">
			<Typography color="error" variant="body1" className="font-semibold">Failed to load stores</Typography>
			<Typography color="text.secondary" variant="caption">Please check your connection or try again later.</Typography>
		</Paper>
	);

	/**
	 * Main rendered table component.
	 */
	return (
		<Paper
			className="flex flex-col flex-auto shadow-1 rounded-t-lg overflow-hidden rounded-b-none w-full h-full"
			elevation={0}
		>
			<DataTable
				data={stores?.data ?? []}
				columns={columns}
				manualPagination
				rowCount={stores?.pagination?.total ?? 0}
				state={{ pagination, isLoading }}
				onPaginationChange={setPagination}
				renderRowActionMenuItems={({ closeMenu, row, table }) => [
					<MenuItem
						key="delete"
						onClick={() => {
							setDeleteIds([row.original.id]);
							setConfirmDialogOpen(true);
							setTableInstance(table);
							closeMenu();
						}}
					>
						<ListItemIcon>
							<FuseSvgIcon>heroicons-outline:trash</FuseSvgIcon>
						</ListItemIcon>
						Delete
					</MenuItem>
				]}
				renderTopToolbarCustomActions={({ table }) => {
					const { rowSelection } = table.getState();

					if (Object.keys(rowSelection).length === 0) return null;

					return (
						<Button
							variant="contained"
							size="small"
							color="secondary"
							onClick={() => {
								const selectedIds = table.getSelectedRowModel().rows.map((r) => r.original.id);
								setDeleteIds(selectedIds);
								setConfirmDialogOpen(true);
								setTableInstance(table);
							}}
							className="flex shrink min-w-9 ltr:mr-2 rtl:ml-2"
						>
							<FuseSvgIcon size={16}>heroicons-outline:trash</FuseSvgIcon>
							<span className="hidden sm:flex mx-2">Delete selected items</span>
						</Button>
					);
				}}
			/>

			{/* 🔹 SuccessDialog integration */}
			<SuccessDialog
				open={successDialogOpen}
				onClose={handleCloseSuccessDialog}
				message={successMessage}
			/>

			{/* 🔹 ConfirmDialog integration */}
			<ConfirmDialog
				open={confirmDialogOpen}
				onClose={() => {
					setConfirmDialogOpen(false);
					setDeleteIds([]);
					setTableInstance(null);
				}}
				onConfirm={handleRemoveConfirmed}
				isDeleting={isDeleting}
			/>
		</Paper>
	);
}

export default StoresTable;
