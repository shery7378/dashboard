'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { type MRT_ColumnDef } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
import {
	Chip,
	ListItemIcon,
	MenuItem,
	Paper,
	Button,
	Typography
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Link from '@fuse/core/Link';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import {
	EcommerceProduct,
	useDeleteECommerceProductMutation,
	useGetECommerceProductsQuery
} from '../apis/ProductsLaravelApi';
import ProductModel from './models/ProductModel';
import { getContrastColor } from '@/utils/colorUtils';
import { ConfirmDialog, SuccessDialog } from '@/components/DialogComponents';
import { useAdminTable } from '@/hooks/useAdminTable';
import { formatImageUrl } from '@/utils/Constants';
import './i18n';

/**
 * Table showing all e-commerce products.
 */
function ProductsTable() {
	const { t } = useTranslation('products');
	const [removeProduct] = useDeleteECommerceProductMutation();

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
		deleteMutation: removeProduct,
		entityName: 'Product',
	});

	const { data: products, isLoading, error } = useGetECommerceProductsQuery({
		page: pagination.pageIndex + 1,
		perPage: pagination.pageSize
	}, {
		refetchOnMountOrArgChange: 300,
		refetchOnFocus: false
	});

	const productList: EcommerceProduct[] = useMemo(() => {
		const raw = products as any;
		const productsData = raw?.data ?? raw?.products?.data ?? raw?.products ?? [];
		return Array.isArray(productsData) ? productsData.map((p: any) => ProductModel(p)) : [];
	}, [products]);

	const columns = useMemo<MRT_ColumnDef<EcommerceProduct>[]>(
		() => [
			{
				accessorKey: 'featured_image.url',
				header: '',
				enableColumnFilter: false,
				size: 80,
				enableSorting: false,
				Cell: ({ row }) => (
					<div className="flex items-center justify-center relative w-16 h-16 bg-gray-50 rounded-lg overflow-hidden border-1 border-divider shadow-sm">
						<img
							className="object-cover w-full h-full"
							src={formatImageUrl(row.original.featured_image?.url)}
							alt={row.original.name || 'Product'}
							onError={(e) => {
								(e.target as HTMLImageElement).src = '/assets/images/apps/ecommerce/product-image-placeholder.png';
							}}
						/>
					</div>
				)


			},
			{
				accessorKey: 'name',
				header: t('name'),
				Cell: ({ row }) => (
					<Typography
						component={Link}
						to={`/apps/e-commerce/products/${row.original.id}/${row.original.slug}`}
						className="font-semibold hover:underline decoration-secondary"
					>
						{row.original.name}
					</Typography>
				)
			},
			{
				accessorKey: 'main_category.name',
				header: t('category'),
				Cell: ({ row }) => {
					const cat = row.original.main_category;
					return cat ? <Chip label={cat.name} size="small" variant="outlined" className="text-11 font-medium bg-gray-100/50" /> : '—';
				}
			},
			{
				accessorKey: 'price_tax_excl',
				header: t('price'),
				Cell: ({ row }) => {
					const price = parseFloat(String(row.original.price_tax_excl || row.original.price || 0));
					return price > 0 ? (
						<span className="font-bold text-secondary text-15">£{price.toFixed(2)}</span>
					) : '—';
				}
			},
			{
				accessorKey: 'quantity',
				header: t('quantity'),
				Cell: ({ row }) => {
					const quantity = parseInt(String(row.original.quantity || 0));
					const statusColor = quantity <= 5 ? 'bg-red-500' : quantity <= 25 ? 'bg-orange-500' : 'bg-green-500';
					return (
						<div className="flex items-center space-x-2">
							<span className={clsx("font-medium", quantity <= 5 && "text-red-600")}>{quantity > 0 ? quantity : 'Out of Stock'}</span>
							<i className={clsx('inline-block w-2.5 h-2.5 rounded-full border-1 border-white shadow-sm', statusColor)} />
						</div>
					);
				}
			},
			{
				accessorKey: 'active',
				header: t('active'),
				Cell: ({ row }) => (
					<Typography
						className={`text-11 font-bold px-2 py-0.5 rounded inline-block uppercase tracking-wider ${row.original.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
					>
						{row.original.active ? t('active') : t('draft')}
					</Typography>
				)
			}
		],
		[t]
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
			{t('delete')}
		</MenuItem>
	], [openDeleteDialog, t]);

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
				{t('delete_selected_items')}
			</Button>
		);
	}, [openDeleteDialog, t]);

	if (error) return (
		<Paper className="p-24 flex flex-col items-center justify-center shadow-1 rounded-lg">
			<Typography color="error" variant="body1" className="font-semibold text-20">Failed to load products</Typography>
			<Typography color="text.secondary" variant="body2">Please check your connection or try again later.</Typography>
		</Paper>
	);

	return (
		<Paper className="flex flex-col flex-auto shadow hover:shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden border-1 border-divider" elevation={0}>
			<DataTable
				data={productList}
				columns={columns}
				manualPagination
				rowCount={products?.pagination?.total ?? 0}
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

export default ProductsTable;

