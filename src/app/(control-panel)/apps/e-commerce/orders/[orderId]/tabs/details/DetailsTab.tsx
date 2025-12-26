'use client';

import { useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar, Typography, FormControl, InputLabel, Select, MenuItem, } from '@mui/material';
import { useFormContext, Controller } from 'react-hook-form';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import type { EcommerceOrder } from '../../../../apis/ECommerceOrdersApi';
import OrderItems from './OrderItems';

interface Props {
	order: EcommerceOrder;
}

/**
 * Order Details tab
 * - Displays customer, order, payment, shipping, and products
 * - Syncs with react-hook-form context
 */
export default function DetailsTab({ order }: Props) {
	const { control, reset } = useFormContext<EcommerceOrder>();

	/** Sync form state when order data updates */
	useEffect(() => {
		if (order) reset(order);
	}, [order, reset]);

	if (!order) return null;

	const customer = order.user;

	return (
		<div className="w-full max-w-5xl space-y-12">
			{/* Customer Info */}
			<section className="space-y-4">
				<header className="flex items-center border-b-1 space-x-2 pb-2">
					<FuseSvgIcon color="action" size={24}>
						heroicons-outline:user-circle
					</FuseSvgIcon>
					<Typography className="text-2xl" color="text.secondary">
						Customer
					</Typography>
				</header>

				<div className="table-responsive border rounded-md">
					<table className="table dense simple">
						<thead>
							<tr>
								<th>Name</th>
								<th>Email</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>
									<div className="flex items-center">
										<Avatar>{customer?.name?.charAt(0) || '?'}</Avatar>
										<Typography className="truncate mx-2">
											{customer?.name || '—'}
										</Typography>
									</div>
								</td>
								<td>
									<Typography className="truncate">{customer?.email || '—'}</Typography>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			{/* Order Status */}
			<section className="space-y-4">
				<header className="flex items-center border-b-1 space-x-2 pb-2">
					<FuseSvgIcon color="action" size={24}>
						heroicons-outline:clock
					</FuseSvgIcon>
					<Typography className="text-2xl" color="text.secondary">
						Order Status
					</Typography>
				</header>

				<div className="table-responsive border rounded-md p-4">
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>Shipping Status</TableCell>
								<TableCell>Payment</TableCell>
								<TableCell>Order On</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							<TableRow>
								<TableCell>
									<FormControl fullWidth size="small">
										<InputLabel>Shipping Status</InputLabel>
										<Controller
											name="shipping_status"
											control={control}
											render={({ field }) => (
												<Select
													{...field}
													label="Shipping Status"
												>
													<MenuItem value="pending">Pending</MenuItem>
													<MenuItem value="processing">Processing</MenuItem>
													<MenuItem value="delivered">Delivered</MenuItem>
												</Select>
											)}
										/>
									</FormControl>
								</TableCell>
								<TableCell>{order.payment_status || '—'}</TableCell>
								<TableCell>
									{order.created_at
										? new Date(order.created_at).toLocaleString()
										: '—'}
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>
			</section>

			{/* Payment */}
			<section className="space-y-4">
				<header className="flex items-center border-b-1 space-x-2 pb-2">
					<FuseSvgIcon color="action" size={24}>
						heroicons-outline:currency-pound
					</FuseSvgIcon>
					<Typography className="text-2xl" color="text.secondary">
						Payment
					</Typography>
				</header>

				<div className="table-responsive border rounded-md">
					<table className="simple">
						<thead>
							<tr>
								<th>Amount</th>
								<th>Shipping Fee</th>
								<th>Payment Status</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>£ {order.price ?? '—'}</td>
								<td>£ {order.shipping_fee ?? '—'}</td>
								<td>{order.payment_status || '—'}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			{/* Shipping */}
			<section className="space-y-4">
				<header className="flex items-center border-b-1 space-x-2 pb-2">
					<FuseSvgIcon color="action" size={24}>
						heroicons-outline:truck
					</FuseSvgIcon>
					<Typography className="text-2xl" color="text.secondary">
						Shipping
					</Typography>
				</header>

				<div className="table-responsive border rounded-md">
					<table className="simple dense">
						<thead>
							<tr>
								<th>Address</th>
								<th>Delivery Option</th>
								<th>Status</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>{order.shipping_address || '—'}</td>
								<td>{order.delivery_option || '—'}</td>
								<td>{order.shipping_status || '—'}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			{/* Products */}
			<section className="space-y-4">
				<header className="flex items-center border-b-1 space-x-2 pb-2">
					<FuseSvgIcon color="action" size={24}>
						heroicons-outline:shopping-cart
					</FuseSvgIcon>
					<Typography className="text-2xl" color="text.secondary">
						Products
					</Typography>
				</header>

				<OrderItems order={order} />
			</section>
		</div>
	);
}
