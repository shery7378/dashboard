//src/app/(control-panel)/apps/e-commerce/orders/OrdersTable.tsx
import { useMemo } from 'react';
import { type MRT_ColumnDef } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
import { ListItemIcon, MenuItem, Paper, Typography } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Button from '@mui/material/Button';
import Link from '@fuse/core/Link';
import FuseLoading from '@fuse/core/FuseLoading';
import {
	EcommerceOrder,
	useDeleteECommerceOrderMutation,
	useGetECommerceOrdersQuery
} from '../apis/ECommerceOrdersApi';
import OrdersStatus from './OrdersStatus';

function OrdersTable() {
	const {
		data: orders,
		isLoading,
		error
	} = useGetECommerceOrdersQuery(undefined, {
		refetchOnFocus: false,
		refetchOnReconnect: false
	});
	const [removeOrders] = useDeleteECommerceOrderMutation();

	const columns = useMemo<MRT_ColumnDef<EcommerceOrder>[]>(
		() => [
			{
				accessorKey: 'order_number',
				header: 'Order Number',
				size: 64,
				Cell: ({ row }) => (
					<Typography
						component={Link}
						to={`/apps/e-commerce/orders/${row.original.id}`}
						role="button"
					>
						<u>{row.original.order_number}</u>
					</Typography>
				)
			},
			{
				accessorKey: 'user.name',
				header: 'Customer',
				Cell: ({ row }) => row.original.user?.name ?? '—'
			},
			{
				accessorKey: 'vendor.name',
				header: 'Vendor',
				Cell: ({ row }) => row.original.vendor?.name ?? row.original.store?.name ?? '—'
			},
			{
				accessorKey: 'price',
				header: 'Total',
				size: 64,
				Cell: ({ row }) => {
					const rawPrice = row.original.price;
					const priceValue = rawPrice?.toString().replace(/[£$,\s]/g, '') || '0';
					const formatted = `£${parseFloat(priceValue).toFixed(2)}`;
					return formatted;
				}
			},
			{
				accessorKey: 'payment_status',
				header: 'Payment',
				size: 128,
				// Cell: ({ row }) => row.original.payment_status ?? '—'
				Cell: ({ row }) => <OrdersStatus name={row.original.payment_status} />
			},
			{
				accessorKey: 'shipping_status',
				header: 'Status',
				Cell: ({ row }) => <OrdersStatus name={row.original.shipping_status} />
			},
			{
				accessorKey: 'created_at',
				header: 'Order Date',
				Cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString()
			},
			{
				accessorKey: 'product_detail',
				header: 'Products',
				Cell: ({ row }) => (
					<div>
						{Array.isArray(row.original.product_detail) && row.original.product_detail.length > 0 ? (
							row.original.product_detail.map((item, index) => {
								if (item.product_detail && typeof item.product_detail === 'object') {
									return (
										<Typography
											key={index}
											variant="body2"
											className="border-b-1 mb-1"
										>
											{Object.entries(item.product_detail).map(([key, value]) =>
												['name', 'quantity'].includes(key) ? (
													<span
														key={key}
														style={{ marginRight: '8px' }}
													>
														{key == 'quantity'
															? '(Qty:' + String(value) + ')'
															: String(value)}
													</span>
												) : null
											)}
										</Typography>
									);
								}

								return null;
							})
						) : (
							<Typography variant="body2">—</Typography>
						)}
					</div>
				)
			}
		],
		[]
	);

	if (isLoading) {
		return <FuseLoading />;
	}

	if (error) {
		return <Typography color="error">Failed to load orders</Typography>;
	}

	return (
		<Paper
			className="flex flex-col flex-auto shadow-1 rounded-t-lg overflow-hidden rounded-b-none w-full h-full"
			elevation={0}
		>
			<DataTable
				initialState={{
					density: 'spacious',
					showColumnFilters: false,
					showGlobalFilter: true,
					columnPinning: {
						left: ['mrt-row-expand', 'mrt-row-select'],
						right: ['mrt-row-actions']
					},
					pagination: {
						pageIndex: 0,
						pageSize: 20
					}
				}}
				enableRowSelection={false}
				enableRowActions={false}
				data={orders?.data ?? []}
				columns={columns}
				renderRowActionMenuItems={({ closeMenu, row, table }) => [
					<MenuItem
						key="delete"
						onClick={() => {
							removeOrders([row.original.id]);
							closeMenu();
							table.resetRowSelection();
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

					if (Object.keys(rowSelection).length === 0) {
						return null;
					}

					return (
						<Button
							variant="contained"
							size="small"
							onClick={() => {
								const selectedRows = table.getSelectedRowModel().rows;
								removeOrders(selectedRows.map((row) => row.original.id));
								table.resetRowSelection();
							}}
							className="flex shrink min-w-9 ltr:mr-2 rtl:ml-2"
							color="secondary"
						>
							<FuseSvgIcon size={16}>heroicons-outline:trash</FuseSvgIcon>
							<span className="hidden sm:flex mx-2">Delete selected items</span>
						</Button>
					);
				}}
			/>
		</Paper>
	);
}

export default OrdersTable;
