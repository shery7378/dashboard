'use client';

import { useEffect, useMemo, useState } from 'react';
import { type MRT_ColumnDef } from 'material-react-table';
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

function UsersTable() {
	const isMountedRef = useIsMounted();

	// 🔹 track pagination state
	const [pagination, setPagination] = useState({
		pageIndex: 0, // MRT is 0-based
		pageSize: 10
	});

	// 🔹 call API with page & per_page
	const {
		data: profilesRes,
		isLoading,
		error
	} = useGetProfilesQuery({
		page: pagination.pageIndex + 1, // backend expects 1-based
		per_page: pagination.pageSize
	});

	const [deleteProfile] = useDeleteProfileMutation();

	// profiles list
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
				header: 'Name',
				Cell: ({ row }) => (
					<Typography
						component={Link}
						to={`/apps/users/${row.original.id}`}
						role="button"
					>
						<u>{row.original.user?.name}</u>
					</Typography>
				)
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

	if (isLoading) {
		return <FuseLoading />;
	}

	if (error) return <Typography color="error">Failed to load Users</Typography>;

	return (
		<Paper
			className="flex flex-col flex-auto shadow-1 rounded-t-lg overflow-hidden rounded-b-none w-full h-full"
			elevation={0}
		>
			<DataTable
				data={profiles}
				columns={columns}
				// 🔹 server-side pagination props
				manualPagination
				rowCount={profilesRes?.pagination?.total ?? 0}
				state={{ pagination }}
				onPaginationChange={setPagination}
				renderRowActionMenuItems={({ closeMenu, row, table }) => [
					<MenuItem
						key="delete"
						onClick={async () => {
							await deleteProfile(row.original.id);

							if (isMountedRef.current) {
								closeMenu();
								table.resetRowSelection();
							}
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
							onClick={async () => {
								const selectedIds = table.getSelectedRowModel().rows.map((r) => r.original.id);

								if (selectedIds.length > 0) {
									await Promise.all(selectedIds.map((id) => deleteProfile(id)));

									if (isMountedRef.current) {
										table.resetRowSelection();
									}
								}
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
		</Paper>
	);
}

export default UsersTable;
