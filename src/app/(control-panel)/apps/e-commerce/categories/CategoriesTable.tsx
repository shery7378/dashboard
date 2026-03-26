'use client';

import { useMemo } from 'react';
import { MRT_ColumnDef } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
import { ListItemIcon, MenuItem, Paper, Typography, Button, Avatar } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Link from '@fuse/core/Link';
import {
	EcommerceCategory,
	useGetECommerceCategoriesQuery,
	useDeleteECommerceCategoryMutation,
} from '../apis/CategoriesLaravelApi';
import { ConfirmDialog, SuccessDialog } from '@/components/DialogComponents';
import { useAdminTable } from '@/hooks/useAdminTable';
import { formatDate, formatImageUrl } from '@/utils/Constants';

/**
 * Table showing e-commerce categories and sub-categories.
 */
function CategoriesTable() {
	const [deleteCategory] = useDeleteECommerceCategoryMutation();

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
		deleteMutation: deleteCategory,
		entityName: 'Category',
	});

	const {
		data: categoriesRes,
		isLoading,
		error
	} = useGetECommerceCategoriesQuery({
		page: pagination.pageIndex + 1,
		perPage: pagination.pageSize
	});

	const categories = categoriesRes?.data ?? [];

	// Create a lookup map for parent category names
	const parentCategoryMap = useMemo(() => {
		const map = new Map<string, string>();
		categories.forEach((category) => {
			map.set(category.id, category.name);
		});
		return map;
	}, [categories]);

	const columns = useMemo<MRT_ColumnDef<EcommerceCategory>[]>(
		() => [
			{
				accessorKey: 'image',
				header: 'Image',
				enableSorting: false,
				size: 64,
				Cell: ({ row }) => (
					<Avatar
						variant="rounded"
						src={formatImageUrl(row.original.image_url || row.original.image)}
						alt={row.original.name}
						sx={{ width: 44, height: 44, borderRadius: 1 }}
					/>
				)
			},
			{
				accessorKey: 'name',
				header: 'Name',
				Cell: ({ row }) => (
					<Typography
						component={Link}
						to={`/apps/e-commerce/categories/${row.original.id}/${row.original.slug}`}
						className="font-semibold hover:underline decoration-secondary"
					>
						{row.original.name}
					</Typography>
				)
			},
			{ accessorKey: 'slug', header: 'Slug' },
			{ 
				accessorKey: 'description', 
				header: 'Description',
				Cell: ({ row }) => <span className="text-13 text-text-secondary truncate max-w-xs block">{row.original.description || '—'}</span>
			},
			{
				accessorKey: 'active',
				header: 'Status',
				Cell: ({ row }) => (
					<Typography
						className={`text-12 font-bold px-2 py-0.5 rounded inline-block ${row.original.active === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
					>
						{row.original.active === 1 ? 'Active' : 'Inactive'}
					</Typography>
				)
			},
			{
				accessorKey: 'parent_id',
				header: 'Parent',
				Cell: ({ row }) => {
					if (row.original.parent_id) {
						const parentName = parentCategoryMap.get(row.original.parent_id);
						return <span className="text-13 bg-gray-100 px-2 py-0.5 rounded">{parentName || row.original.parent_id}</span>;
					}
					return <span className="text-gray-400">—</span>;
				}
			},
			{
				accessorKey: 'created_at',
				header: 'Created At',
				Cell: ({ row }) => formatDate(row.original.created_at)
			}
		],
		[parentCategoryMap]
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
				Delete selected items
			</Button>
		);
	}, [openDeleteDialog]);

	if (error) return (
		<Paper className="p-24 flex flex-col items-center justify-center shadow-1 rounded-lg">
			<Typography color="error" variant="body1" className="font-semibold text-20">Failed to load categories</Typography>
			<Typography color="text.secondary" variant="body2">Please check your connection or try again later.</Typography>
		</Paper>
	);

	return (
		<Paper className="flex flex-col flex-auto shadow hover:shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden border-1 border-divider" elevation={0}>
			<DataTable
				data={categories}
				columns={columns}
				manualPagination
				rowCount={categoriesRes?.pagination.total ?? 0}
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

export default CategoriesTable;

