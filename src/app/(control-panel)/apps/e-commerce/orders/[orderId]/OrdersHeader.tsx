'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFormContext, useFormState } from 'react-hook-form';
import { useParams } from 'next/navigation';
import { motion } from 'motion/react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import PageBreadcrumb from 'src/components/PageBreadcrumb';
import useNavigate from '@fuse/hooks/useNavigate';
import { enqueueSnackbar } from 'notistack';
import {
	EcommerceOrder,
	useUpdateECommerceShippingStatusMutation,
	useDeleteECommerceOrderMutation,
} from '../../apis/ECommerceOrdersApi';
import { ConfirmDialog, SuccessDialog } from '@/components/DialogComponents';
import _ from 'lodash';

type OrdersHeaderProps = {
	order: EcommerceOrder;
};

export default function OrdersHeader({ order }: OrdersHeaderProps) {
	const { orderId } = useParams<{ orderId: string }>();
	const navigate = useNavigate();

	/** 🧩 Access form context from DetailsTab */
	const { getValues, control, reset, watch } = useFormContext<EcommerceOrder>();
	const { dirtyFields, isValid } = useFormState(
		{ control },
		{ dirtyFields: true, isValid: true } // ✅ Explicit subscription - ensures updates on field changes
	);

	// Watch ensures this component re-renders when form fields change
	watch('shipping_status'); // ✅ Targeted watch for the problematic field
	console.log(order, 'order from order page');
	/** API mutations */
	const [updateOrder, { isLoading: isUpdating }] = useUpdateECommerceShippingStatusMutation();
	const [deleteOrder, { isLoading: isDeleting }] = useDeleteECommerceOrderMutation();

	/** Dialog states */
	const [successDialogOpen, setSuccessDialogOpen] = useState(false);
	const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
	const [message, setMessage] = useState('');

	/** Derived UI state - Only enable Save if main shipping_status is dirty */
	const isMainStatusDirty = !!dirtyFields?.shipping_status; // Specific check for main order status only
	const isSaveDisabled = !isMainStatusDirty || !isValid || isUpdating || isDeleting; // Ignore item-level dirties

	// TEMP DEBUG LOG - Remove after confirming it works
	useEffect(() => {
		console.log('Header Debug - Dirty Fields:', dirtyFields);
		console.log('Header Debug - isValid:', isValid);
		console.log('Header Debug - shipping_status value:', watch('shipping_status'));
		console.log('Header Debug - isMainStatusDirty:', isMainStatusDirty);
		console.log('Header Debug - isSaveDisabled:', isSaveDisabled);
	}, [dirtyFields, isValid, watch, isMainStatusDirty, isSaveDisabled]);

	/** Save handler - Only saves main order shipping_status */
	async function handleSave() {
		try {
			const { shipping_status } = getValues();
			await updateOrder({ id: order.id, shipping_status }).unwrap();
			reset({ ...order, shipping_status }); // Reset only main status
			setMessage('Order updated successfully.');
			setSuccessDialogOpen(true);
			enqueueSnackbar('Order updated successfully', { variant: 'success' });
		} catch (err: any) {
			console.error('Update error:', err);
			enqueueSnackbar(err?.data?.error ?? 'Failed to update order', { variant: 'error' });
		}
	}

	/** Delete handler */
	async function handleDeleteConfirmed() {
		try {
			await deleteOrder(orderId).unwrap();
			enqueueSnackbar('Order deleted successfully', { variant: 'success' });
			navigate('/apps/e-commerce/orders');
		} catch (err: any) {
			console.error('Delete error:', err);
			enqueueSnackbar(err?.data?.error ?? 'Failed to delete order', { variant: 'error' });
		} finally {
			setConfirmDialogOpen(false);
		}
	}

	return (
		<div className="flex flex-col sm:flex-row flex-1 w-full items-center justify-between py-6 sm:py-8">
			{/* Left: Breadcrumb + Title */}
			<div className="flex flex-col items-start w-full sm:max-w-full min-w-0">
				<motion.div
					initial={{ x: 20, opacity: 0 }}
					animate={{ x: 0, opacity: 1, transition: { delay: 0.3 } }}
				>
					<PageBreadcrumb className="mb-2" />
				</motion.div>

				<motion.div
					className="flex flex-col min-w-0"
					initial={{ x: -20 }}
					animate={{ x: 0, transition: { delay: 0.3 } }}
				>
					<Typography className="text-lg sm:text-2xl truncate font-semibold">
						Order: {order?.order_number || 'Order'}
					</Typography>
					{order?.user?.name && (
						<Typography variant="caption" className="font-medium text-gray-600">
							From: {order.user.name}
						</Typography>
					)}
				</motion.div>
			</div>

			{/* Right: Actions */}
			<motion.div
				className="flex flex-1 w-full sm:justify-end"
				initial={{ opacity: 0, x: 20 }}
				animate={{ opacity: 1, x: 0, transition: { delay: 0.3 } }}
			>
				<Button
					className="mx-1"
					variant="contained"
					color="secondary"
					onClick={() => setConfirmDialogOpen(true)}
					disabled={isDeleting}
					startIcon={<FuseSvgIcon>heroicons-outline:trash</FuseSvgIcon>}
				>
					{isDeleting ? 'Removing...' : 'Remove'}
				</Button>

				<Button
					className="mx-1"
					variant="contained"
					color="secondary"
					onClick={handleSave}
					disabled={isSaveDisabled} 
					startIcon={<FuseSvgIcon>heroicons-outline:check</FuseSvgIcon>}
				>
					{isUpdating ? 'Saving...' : 'Save'}
				</Button>
			</motion.div>

			{/* Dialogs */}
			<SuccessDialog
				open={successDialogOpen}
				onClose={() => setSuccessDialogOpen(false)}
				message={message}
			/>
			<ConfirmDialog
				open={confirmDialogOpen}
				onClose={() => setConfirmDialogOpen(false)}
				onConfirm={handleDeleteConfirmed}
				isDeleting={isDeleting}
			/>
		</div>
	);
}