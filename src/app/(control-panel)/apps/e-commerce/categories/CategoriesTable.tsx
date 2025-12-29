'use client';

import { useEffect, useMemo, useState } from 'react';
import { MRT_ColumnDef, MRT_TableInstance } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
import FuseLoading from '@fuse/core/FuseLoading';
import { ListItemIcon, MenuItem, Paper, Typography, Button, Avatar, IconButton } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Link from '@fuse/core/Link';
import {
	EcommerceCategory,
	useGetECommerceCategoriesQuery,
	useDeleteECommerceCategoryMutation,
	useDeleteECommerceCategoriesMutation,
} from '../apis/CategoriesLaravelApi';
import { useIsMounted } from 'src/hooks/useIsMounted';
import { ConfirmDialog, SuccessDialog } from '@/components/DialogComponents';
import { useEntityManager } from 'src/hooks/useEntityManager';

function CategoriesTable() {
	const isMountedRef = useIsMounted();
	const {
		confirmOpen,
		confirmTitle,
		confirmMessage,
		loading,
		successMessage,
		clearSuccessMessage,
		requestAction,
		confirmAction,
		cancelAction,
	} = useEntityManager();

	const [tableInstance, setTableInstance] = useState<MRT_TableInstance<EcommerceCategory> | null>(null);
	const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

	const [pagination, setPagination] = useState({
		pageIndex: 0, // MRT uses 0-based indexing
		pageSize: 1000, // Increased to show all categories
	});

	const [deleteCategory] = useDeleteECommerceCategoryMutation();
	const [deleteCategories] = useDeleteECommerceCategoriesMutation();

	const {
		data: categoriesRes,
		isLoading,
		error,
	} = useGetECommerceCategoriesQuery({
		page: pagination.pageIndex + 1,
		perPage: pagination.pageSize,
	});

	const categories = categoriesRes?.data ?? [];

	const columns = useMemo<MRT_ColumnDef<EcommerceCategory>[]>(
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
							alt={row.original.name}
							sx={{ width: 40, height: 40 }}
						/>
					);
				},
			},
			{
				accessorKey: 'name',
				header: 'Name',
				Cell: ({ row }) => (
					<Typography
						component={Link}
						to={`/apps/e-commerce/categories/${row.original.id}/${row.original.slug}`}
						role="button"
					>
						<u>{row.original.name}</u>
					</Typography>
				),
			},
			{ accessorKey: 'slug', header: 'Slug' },
			{ accessorKey: 'description', header: 'Description' },
			{
				accessorKey: 'active',
				header: 'Status',
				Cell: ({ row }) => (
					<Typography
						variant="body2"
						color={row.original.active === 1 ? 'success.main' : 'error.main'}
						fontWeight="normal"
					>
						{row.original.active === 1 ? 'Active' : 'Inactive'}
					</Typography>
				),
			},
			{
				accessorKey: 'parent_id',
				header: 'Parent ID',
				Cell: ({ row }) => row.original.parent_id ?? '—',
			},
			{
				accessorKey: 'created_at',
				header: 'Created At',
				Cell: ({ row }) =>
					row.original.created_at
						? new Date(row.original.created_at).toLocaleDateString()
						: '—',
			},
		],
		[]
	);

	useEffect(() => {
		if (!isMountedRef.current) return;

		if (categoriesRes) {
			setRowSelection({});
		}
		if (error) {
			console.error('Failed to load categories:', error);
		}
	}, [categoriesRes, error, isMountedRef]);

	const handleDelete = (rows: EcommerceCategory[]) => {
		console.log(rows, 'slected rows');
		const ids = rows.map((r) => r.id);
		console.log(ids, 'slected ids');
		let confirmTitle = '';
		if (ids.length > 1) {
			if (rows.every((r) => r.parent_id)) {
				confirmTitle = 'Delete Child Categories';
			} else if (rows.every((r) => !r.parent_id)) {
				confirmTitle = 'Delete Parent Categories';
			} else {
				confirmTitle = 'Delete Categories';
			}
		} else {
			const row = rows[0];
			confirmTitle = row?.parent_id ? 'Delete Child Category' : 'Delete Parent Category';
		}

		requestAction({
			ids,
			action: deleteCategory,
			// bulkAction: deleteCategories,
			entityLabel: 'category',
			actionLabel: 'deleted',
			confirmTitle,
			confirmMessage: `Are you sure you want to delete ${ids.length > 1 ? ids.length + ' categories' : 'this category'}?`,
			onSuccess: () => {
				if (isMountedRef.current) {
					setRowSelection({});
				}
			},
			onError: (failed, errors) => {
				console.error('Deletion errors:', errors);
			},
			onCancel: () => {
				setTableInstance(null);
				setRowSelection({});
			},
			snackbarOptions: { autoHideDuration: 5000 },
		});
	};

	if (isLoading) return <FuseLoading />;
	if (error) return <Typography color="error">Failed to load categories</Typography>;

	return (
		<Paper
			className="flex flex-col flex-auto shadow-1 rounded-t-lg overflow-hidden rounded-b-none w-full h-full"
			elevation={0}
		>
			<DataTable
				data={categories}
				columns={[
					...columns,
				]}
				manualPagination
				rowCount={categoriesRes?.pagination.total ?? 0}
				state={{ pagination, rowSelection }}
				onPaginationChange={setPagination}
				onRowSelectionChange={setRowSelection}
				enableExpanding
				getSubRows={(row) => row.children ?? []}
				getRowId={(row) => row.id.toString()}
				enableRowSelection={(row) => true}
				enableMultiRowSelection
				renderRowActionMenuItems={({ closeMenu, row, table }) => [
					// <MenuItem
					// 	key="edit"
					// 	onClick={() => {
					// 		console.log('Edit', row.original.id);
					// 		closeMenu();
					// 	}}
					// >
					// 	<ListItemIcon>
					// 		<FuseSvgIcon>heroicons-outline:pencil</FuseSvgIcon>
					// 	</ListItemIcon>
					// 	Edit
					// </MenuItem>,
					<MenuItem
						key="delete"
						onClick={() => {
							setTableInstance(table);
							handleDelete([row.original]);
							closeMenu();
						}}
					>
						<ListItemIcon>
							<FuseSvgIcon>heroicons-outline:trash</FuseSvgIcon>
						</ListItemIcon>
						Delete
					</MenuItem>,
				]}
				renderTopToolbarCustomActions={({ table }) => {
					const { rowSelection } = table.getState();
					if (Object.keys(rowSelection).length === 0) return null;

					const selectedRows = table.getSelectedRowModel().flatRows.map((r) => r.original);

					return (
						<Button
							variant="contained"
							size="small"
							onClick={() => {
								setTableInstance(table);
								handleDelete(selectedRows);
							}}
							className="flex shrink min-w-9 ltr:mr-2 rtl:ml-2"
							color="secondary"
							disabled={loading}
						>
							<FuseSvgIcon size={16}>heroicons-outline:trash</FuseSvgIcon>
							<span className="hidden sm:flex mx-2">Delete selected</span>
						</Button>
					);
				}}
			/>

			<SuccessDialog open={!!successMessage} onClose={clearSuccessMessage} message={successMessage} />

			<ConfirmDialog
				open={confirmOpen}
				title={confirmTitle}
				message={confirmMessage}
				onConfirm={confirmAction}
				onClose={cancelAction}
				isDeleting={loading}
			/>
		</Paper>
	);
}

export default CategoriesTable;