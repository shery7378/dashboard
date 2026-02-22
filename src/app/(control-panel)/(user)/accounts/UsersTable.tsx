//src/app/(control-panel)/(user)/accounts/UsersTable.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { type MRT_ColumnDef, type MRT_TableInstance } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
import FuseLoading from '@fuse/core/FuseLoading';
import { ListItemIcon, MenuItem, Paper, Typography, Button, Avatar } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Link from '@fuse/core/Link';

import {
	useGetProfilesQuery,
	useDeleteProfileMutation,
	type Profile
} from '@/app/(control-panel)/(user)/accounts/apis/ProfileApi';

import { useIsMounted } from 'src/hooks/useIsMounted';
import { ConfirmDialog, SuccessDialog } from '@/components/DialogComponents';
import { useSnackbar } from 'notistack';

function UsersTable() {
	const isMountedRef = useIsMounted();
	const { enqueueSnackbar } = useSnackbar();

	// 🔹 Confirm dialog state
	const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
	const [deleteIds, setDeleteIds] = useState<string[]>([]);
	const [isDeleting, setIsDeleting] = useState(false);
	const [tableInstance, setTableInstance] = useState<MRT_TableInstance<Profile> | null>(null);

	// 🔹 Success dialog state
	const [successDialogOpen, setSuccessDialogOpen] = useState(false);
	const [successMessage, setSuccessMessage] = useState('');

	// 🔹 Pagination state
	const [pagination, setPagination] = useState({
		pageIndex: 0, // MRT uses 0-based indexing
		pageSize: 10
	});

	const [deleteProfile] = useDeleteProfileMutation();

	// Fetch all users with pagination
	const {
		data: profilesRes,
		isLoading,
		error
	} = useGetProfilesQuery({
		page: pagination.pageIndex + 1, // Convert to 1-based indexing for API
		perPage: pagination.pageSize
	});

	// Profiles list
	const profiles = profilesRes?.data ?? [];

	const columns = useMemo<MRT_ColumnDef<Profile>[]>(
		() => [
			{
				accessorKey: 'image',
				header: 'Image',
				enableSorting: false,
				size: 64,
				Cell: ({ row }) => {
					const img = row.original.image
						? row.original.image.startsWith('http')
							? row.original.image
							: `${process.env.NEXT_PUBLIC_API_URL}/${row.original.image}`
						: '/assets/images/apps/ecommerce/product-image-placeholder.png';

					return (
						<Avatar
							variant="rounded"
							src={img}
							alt={row.original.user?.name || 'User'}
							sx={{ width: 40, height: 40 }}
						/>
					);
				}
			},
			{
				accessorKey: 'user.name',
				header: 'User Name',
				Cell: ({ row }) => (
					<Typography
						component={Link}
						to={`/accounts/${row.original?.user?.id}`}
						role="button"
					>
						<u>{row.original.user?.name}</u>
					</Typography>
				)
			},
			{
				accessorKey: 'user.first_name',
				header: 'Full Name',
				Cell: ({ row }) => (
					<>
						{row.original.first_name} {row.original.last_name}
					</>
				)
			},
			{
				accessorKey: 'user.roles',
				header: 'User As',
				Cell: ({ row }) => <>{row.original.user?.roles?.join(', ') || '—'}</>
			},
			{
				accessorKey: 'user.email',
				header: 'Email'
			},
			{
				accessorKey: 'phone',
				header: 'Phone',
				Cell: ({ row }) => row.original.phone ?? '—'
			},
			{
				accessorKey: 'address',
				header: 'Address',
				Cell: ({ row }) => row.original.address ?? '—'
			},
			{
				accessorKey: 'company_name',
				header: 'Company Name',
				Cell: ({ row }) => row.original.company_name ?? '—'
			},
			{
				accessorKey: 'country',
				header: 'Country',
				Cell: ({ row }) => row.original.country ?? '—'
			},
			{
				accessorKey: 'status',
				header: 'Status',
				Cell: ({ row }) => row.original.status ?? '—'
			},
			{
				accessorKey: 'created_at',
				header: 'Created At',
				Cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString()
			}
		],
		[]
	);

	useEffect(() => {
		if (!isMountedRef.current) return;

		if (profilesRes) {
			console.log('Fetched Profiles:', profilesRes);
		}

		if (error) {
			console.error('Failed to load Profiles:', error);
		}
	}, [profilesRes, error, isMountedRef]);

	// 🔹 Confirm delete handler
	const handleRemoveConfirmed = async () => {
		setIsDeleting(true);
		try {
			const results = await Promise.allSettled(deleteIds.map((id) => deleteProfile(id)));

			const succeeded = results.filter((r) => r.status === 'fulfilled').length;
			const failed = results.filter((r) => r.status === 'rejected').length;

			if (succeeded > 0) {
				const message =
					succeeded === 1 ? 'User deleted successfully' : `${succeeded} users deleted successfully`;
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

	if (isLoading) return <FuseLoading />;

	if (error) return <Typography color="error">Failed to load Users</Typography>;

	return (
		<Paper
			className="flex flex-col flex-auto shadow-1 rounded-t-lg overflow-hidden rounded-b-none w-full h-full"
			elevation={0}
		>
			<DataTable
				data={profiles}
				columns={columns}
				manualPagination
				rowCount={profilesRes?.pagination.total ?? 0}
				state={{ pagination }}
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
							onClick={() => {
								const selectedIds = table.getSelectedRowModel().rows.map((r) => r.original.id);
								setDeleteIds(selectedIds);
								setConfirmDialogOpen(true);
								setTableInstance(table);
							}}
							className="flex shrink min-w-9 ltr:mr-2 rtl:ml-2"
							color="secondary"
						>
							<FuseSvgIcon size={16}>heroicons-outline:trash</FuseSvgIcon>
							<span className="hidden sm:flex mx-2">Delete selected</span>
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

export default UsersTable;
