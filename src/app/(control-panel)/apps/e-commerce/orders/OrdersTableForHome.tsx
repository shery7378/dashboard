//src/app/(control-panel)/apps/e-commerce/orders/OrdersTableForHome.tsx
import { useMemo } from 'react';
import { type MRT_ColumnDef } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
import { Paper, Typography } from '@mui/material';
import Link from '@fuse/core/Link';
import FuseLoading from '@fuse/core/FuseLoading';
import { useSession } from 'next-auth/react';
import {
	EcommerceOrder,
	useDeleteECommerceOrdersMutation,
	useGetECommerceOrdersQuery
} from '../apis/ECommerceOrdersApi';
import OrdersStatus from './OrdersStatus';

function OrdersTableForHome() {
	const { data: session, status: sessionStatus } = useSession();

	// Skip query if session is loading or token is not available
	const hasToken =
		session?.accessAuthToken ||
		session?.accessToken ||
		(typeof window !== 'undefined'
			? localStorage.getItem('token') ||
				localStorage.getItem('auth_token') ||
				localStorage.getItem('access_token')
			: null);

	const {
		data: orders,
		isLoading,
		error
	} = useGetECommerceOrdersQuery(undefined, {
		skip: sessionStatus === 'loading' || !hasToken
	});
	const [removeOrders] = useDeleteECommerceOrdersMutation();

	const columns = useMemo<MRT_ColumnDef<EcommerceOrder>[]>(
		() => [
			{
				accessorKey: 'order_number',
				header: 'Order Number',
				size: 64,
				Cell: ({ row }) => {
					const userRole = (session as any)?.user?.role?.[0] || (session as any)?.db?.role?.[0];
					const dashboardLink = userRole === 'supplier' ? '/dashboards/supplier' : '/dashboards/seller';
					return (
						<Typography
							component={Link}
							to={`${dashboardLink}/#OrdersTable`}
							role="button"
						>
							<u>{row.original.order_number}</u>
						</Typography>
					);
				}
			},
			{
				accessorKey: 'user.name',
				header: 'Customer',
				Cell: ({ row }) => row.original.user?.name ?? '—'
			},
			{
				accessorKey: 'price',
				header: 'Total',
				size: 64,
				Cell: ({ row }) => {
					const rawPrice = row.original.price;
					const priceValue = rawPrice?.toString().replace(/[£$,\s]/g, '') || '0';
					const formatted = `\u00A3${parseFloat(priceValue).toFixed(2)}`;
					return <span style={{ fontFamily: 'Arial, sans-serif' }}>{formatted}</span>;
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

	if (sessionStatus === 'loading') {
		return <FuseLoading />;
	}

	if (!hasToken) {
		return (
			<Paper
				className="flex flex-col flex-auto shadow-1 rounded-t-lg overflow-hidden rounded-b-none w-full h-full p-4"
				elevation={0}
			>
				<Typography color="error">Authentication required. Please log in again.</Typography>
			</Paper>
		);
	}

	if (isLoading) {
		return <FuseLoading />;
	}

	if (error) {
		return (
			<Paper
				className="flex flex-col flex-auto shadow-1 rounded-t-lg overflow-hidden rounded-b-none w-full h-full p-4"
				elevation={0}
			>
				<Typography color="error">Failed to load orders. Please refresh the page or log in again.</Typography>
			</Paper>
		);
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
					showGlobalFilter: false
				}}
				enableRowSelection={false}
				enableRowActions={false}
				enableColumnFilters={false}
				enableGlobalFilter={false}
				enableBottomToolbar={false}
				enablePagination={false} // ❌ pagination disable
				data={(orders?.data ?? []).slice(0, 10)} // ✅ only 10 rows
				columns={columns}
				muiTableHeadCellProps={{
					sx: {
						fontSize: '14px',
						fontWeight: 600,
						color: (theme) => theme.palette.text.secondary // muted gray
					}
				}}
				muiTableBodyCellProps={{
					sx: {
						fontSize: '14px',
						fontWeight: 400
					}
				}}
				renderTopToolbarCustomActions={() => (
					<Typography className="text-2xl font-semibold tracking-tight leading-6 truncate">
						Orders Table
					</Typography>
				)}
			/>
		</Paper>
	);
}

export default OrdersTableForHome;
