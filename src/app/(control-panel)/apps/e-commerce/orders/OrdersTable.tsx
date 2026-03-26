'use client';

import { useMemo } from 'react';
import { type MRT_ColumnDef } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
import { ListItemIcon, MenuItem, Paper, Typography, Button } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Link from '@fuse/core/Link';
import {
	EcommerceOrder,
	useDeleteECommerceOrderMutation,
	useGetECommerceOrdersQuery
} from '../apis/ECommerceOrdersApi';
import OrdersStatus from './OrdersStatus';
import { ConfirmDialog, SuccessDialog } from '@/components/DialogComponents';
import { useAdminTable } from '@/hooks/useAdminTable';
import { formatDate } from '@/utils/Constants';

/**
 * Table showing e-commerce orders with customer and seller details.
 */
function OrdersTable() {
	const [removeOrders] = useDeleteECommerceOrderMutation();

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
		deleteMutation: removeOrders,
		entityName: 'Order',
	});

	const {
		data: orders,
		isLoading,
		error
	} = useGetECommerceOrdersQuery({
		page: pagination.pageIndex + 1,
		perPage: pagination.pageSize
	}, {
		refetchOnFocus: false,
		refetchOnReconnect: false,
		refetchOnMountOrArgChange: 300
	});

	const columns = useMemo<MRT_ColumnDef<EcommerceOrder>[]>(
		() => [
			{
				accessorKey: 'order_number',
				header: 'Order Number',
				size: 140,
				Cell: ({ row }) => (
					<Typography
						component={Link}
						to={`/apps/e-commerce/orders/${row.original.id}`}
						className="font-semibold hover:underline decoration-secondary"
					>
						{row.original.order_number}
					</Typography>
				)
			},
			{
				accessorKey: 'user.name',
				header: 'Customer',
				Cell: ({ row }) => <span className="font-medium">{row.original.user?.name || '—'}</span>
			},
			{
				accessorKey: 'vendor.name',
				header: 'Seller',
				Cell: ({ row }) => {
					const sellerName = row.original.vendor?.name || row.original.store?.name || '—';
					return <span className="text-text-secondary">{sellerName}</span>;
				}
			},
			{
				accessorKey: 'price',
				header: 'Total',
				size: 100,
				Cell: ({ row }) => {
					const rawPrice = row.original.price;
					const priceValue = parseFloat(rawPrice?.toString().replace(/[£$,\s]/g, '') || '0');
					return <span className="font-bold text-secondary">£{priceValue.toFixed(2)}</span>;
				}
			},
			{
				accessorKey: 'payment_status',
				header: 'Payment',
				size: 120,
				Cell: ({ row }) => <OrdersStatus name={row.original.payment_status} />
			},
			{
				accessorKey: 'shipping_status',
				header: 'Status',
				size: 120,
				Cell: ({ row }) => <OrdersStatus name={row.original.shipping_status} />
			},
			{
				accessorKey: 'created_at',
				header: 'Order Date',
				Cell: ({ row }) => formatDate(row.original.created_at)
			},
			{
				id: 'products_summary',
				header: 'Products',
				Cell: ({ row }) => {
					const products = row.original.product_detail || [];
					if (!Array.isArray(products) || products.length === 0) return <span className="text-gray-400">—</span>;
					
					return (
						<div className="flex flex-col gap-2">
							{products.slice(0, 2).map((item: any, idx) => (
								<Typography key={idx} variant="caption" className="text-11 leading-tight text-gray-600 truncate max-w-xs">
									{item.product_detail?.name} {item.product_detail?.quantity && `(x${item.product_detail.quantity})`}
								</Typography>
							))}
							{products.length > 2 && (
								<Typography variant="caption" className="text-10 text-primary font-bold">
									+ {products.length - 2} more items
								</Typography>
							)}
						</div>
					);
				}
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
				Delete selected orders
			</Button>
		);
	}, [openDeleteDialog]);

	if (error) return (
		<Paper className="p-24 flex flex-col items-center justify-center shadow-1 rounded-lg">
			<Typography color="error" variant="body1" className="font-semibold text-20">Failed to load orders</Typography>
			<Typography color="text.secondary" variant="body2">Please check your connection or try again later.</Typography>
		</Paper>
	);

	return (
		<Paper className="flex flex-col flex-auto shadow hover:shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden border-1 border-divider" elevation={0}>
			<DataTable
				data={orders?.data ?? []}
				columns={columns}
				manualPagination
				rowCount={orders?.pagination?.total ?? 0}
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

export default OrdersTable;

