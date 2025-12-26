'use client';

import { useState, useEffect } from 'react';
import {
	Box,
	Card,
	CardContent,
	CardHeader,
	Divider,
	FormControlLabel,
	Switch,
	TextField,
	Button,
	Grid,
	Typography,
	Alert,
	Snackbar,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Paper,
} from '@mui/material';
import { useGetOrderSettingsQuery, useUpdateOrderSettingsMutation, useResetOrderSettingsMutation } from './apis/OrderSettingsApi';
import FuseLoading from '@fuse/core/FuseLoading';
import { Controller, useForm } from 'react-hook-form';

type OrderSettingsForm = {
	auto_fulfill_orders: boolean;
	auto_fulfill_delay_minutes: number;
	notify_on_new_order: boolean;
	notify_on_order_update: boolean;
	notify_on_payment_received: boolean;
	default_shipping_method: string | null;
	default_shipping_cost: number | null;
	processing_time_days: number;
	auto_update_to_processing: boolean;
	auto_processing_delay_hours: number;
	auto_update_to_ready: boolean;
	auto_ready_delay_hours: number;
	allow_order_cancellation: boolean;
	cancellation_time_limit_hours: number;
	require_order_confirmation: boolean;
	auto_accept_orders: boolean;
};

const shippingMethods = [
	'Standard Shipping',
	'Express Shipping',
	'Next Day Delivery',
	'Pickup',
	'Digital Delivery',
];

function OrderSettings() {
	const { data, isLoading, error, refetch } = useGetOrderSettingsQuery({});
	const [updateSettings, { isLoading: isUpdating }] = useUpdateOrderSettingsMutation();
	const [resetSettings, { isLoading: isResetting }] = useResetOrderSettingsMutation();
	const [showSuccessMessage, setShowSuccessMessage] = useState(false);
	const [showErrorMessage, setShowErrorMessage] = useState(false);
	const [message, setMessage] = useState('');

	const { control, handleSubmit, reset, watch, formState: { isDirty } } = useForm<OrderSettingsForm>({
		defaultValues: {
			auto_fulfill_orders: false,
			auto_fulfill_delay_minutes: 0,
			notify_on_new_order: true,
			notify_on_order_update: true,
			notify_on_payment_received: true,
			default_shipping_method: null,
			default_shipping_cost: null,
			processing_time_days: 1,
			auto_update_to_processing: false,
			auto_processing_delay_hours: 24,
			auto_update_to_ready: false,
			auto_ready_delay_hours: 48,
			allow_order_cancellation: true,
			cancellation_time_limit_hours: 24,
			require_order_confirmation: false,
			auto_accept_orders: true,
		}
	});

	const autoFulfillOrders = watch('auto_fulfill_orders');
	const autoUpdateToProcessing = watch('auto_update_to_processing');
	const autoUpdateToReady = watch('auto_update_to_ready');

	// Load settings when data is available
	useEffect(() => {
		if (data?.data) {
			reset({
				auto_fulfill_orders: data.data.auto_fulfill_orders ?? false,
				auto_fulfill_delay_minutes: data.data.auto_fulfill_delay_minutes ?? 0,
				notify_on_new_order: data.data.notify_on_new_order ?? true,
				notify_on_order_update: data.data.notify_on_order_update ?? true,
				notify_on_payment_received: data.data.notify_on_payment_received ?? true,
				default_shipping_method: data.data.default_shipping_method ?? null,
				default_shipping_cost: data.data.default_shipping_cost ?? null,
				processing_time_days: data.data.processing_time_days ?? 1,
				auto_update_to_processing: data.data.auto_update_to_processing ?? false,
				auto_processing_delay_hours: data.data.auto_processing_delay_hours ?? 24,
				auto_update_to_ready: data.data.auto_update_to_ready ?? false,
				auto_ready_delay_hours: data.data.auto_ready_delay_hours ?? 48,
				allow_order_cancellation: data.data.allow_order_cancellation ?? true,
				cancellation_time_limit_hours: data.data.cancellation_time_limit_hours ?? 24,
				require_order_confirmation: data.data.require_order_confirmation ?? false,
				auto_accept_orders: data.data.auto_accept_orders ?? true,
			});
		}
	}, [data, reset]);

	const onSubmit = async (formData: OrderSettingsForm) => {
		try {
			await updateSettings(formData).unwrap();
			setMessage('Order settings updated successfully');
			setShowSuccessMessage(true);
			refetch();
		} catch (err: any) {
			setMessage(err?.data?.message || 'Failed to update order settings');
			setShowErrorMessage(true);
		}
	};

	const handleReset = async () => {
		if (!confirm('Are you sure you want to reset all settings to defaults?')) {
			return;
		}
		try {
			await resetSettings({}).unwrap();
			setMessage('Order settings reset to defaults');
			setShowSuccessMessage(true);
			refetch();
		} catch (err: any) {
			setMessage(err?.data?.message || 'Failed to reset order settings');
			setShowErrorMessage(true);
		}
	};

	if (isLoading) {
		return <FuseLoading />;
	}

	if (error) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="error">Failed to load order settings. Please try again.</Alert>
			</Box>
		);
	}

	return (
		<Box sx={{ p: { xs: 2, md: 3 } }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
				<Typography variant="h5" sx={{ fontWeight: 600 }}>
					Order Options
				</Typography>
				<Button
					variant="outlined"
					color="secondary"
					onClick={handleReset}
					disabled={isResetting}
				>
					Reset to Defaults
				</Button>
			</Box>

			<form onSubmit={handleSubmit(onSubmit)}>
				<Grid container spacing={3}>
					{/* Order Fulfillment */}
					<Grid item xs={12}>
						<Card>
							<CardHeader title="Order Fulfillment" />
							<CardContent>
								<Grid container spacing={2}>
									<Grid item xs={12}>
										<Controller
											name="auto_fulfill_orders"
											control={control}
											render={({ field }) => (
												<FormControlLabel
													control={<Switch {...field} checked={field.value} />}
													label="Automatically fulfill orders"
												/>
											)}
										/>
										<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
											Automatically mark orders as fulfilled after a delay
										</Typography>
									</Grid>
									{autoFulfillOrders && (
										<Grid item xs={12} sm={6}>
											<Controller
												name="auto_fulfill_delay_minutes"
												control={control}
												render={({ field }) => (
													<TextField
														{...field}
														label="Auto-fulfill delay (minutes)"
														type="number"
														fullWidth
														inputProps={{ min: 0, max: 10080 }}
													/>
												)}
											/>
										</Grid>
									)}
								</Grid>
							</CardContent>
						</Card>
					</Grid>

					{/* Notifications */}
					<Grid item xs={12}>
						<Card>
							<CardHeader title="Notifications" />
							<CardContent>
								<Grid container spacing={2}>
									<Grid item xs={12}>
										<Controller
											name="notify_on_new_order"
											control={control}
											render={({ field }) => (
												<FormControlLabel
													control={<Switch {...field} checked={field.value} />}
													label="Notify on new order"
												/>
											)}
										/>
									</Grid>
									<Grid item xs={12}>
										<Controller
											name="notify_on_order_update"
											control={control}
											render={({ field }) => (
												<FormControlLabel
													control={<Switch {...field} checked={field.value} />}
													label="Notify on order update"
												/>
											)}
										/>
									</Grid>
									<Grid item xs={12}>
										<Controller
											name="notify_on_payment_received"
											control={control}
											render={({ field }) => (
												<FormControlLabel
													control={<Switch {...field} checked={field.value} />}
													label="Notify on payment received"
												/>
											)}
										/>
									</Grid>
								</Grid>
							</CardContent>
						</Card>
					</Grid>

					{/* Shipping Settings */}
					<Grid item xs={12}>
						<Card>
							<CardHeader title="Shipping Settings" />
							<CardContent>
								<Grid container spacing={2}>
									<Grid item xs={12} sm={6}>
										<Controller
											name="default_shipping_method"
											control={control}
											render={({ field }) => (
												<FormControl fullWidth>
													<InputLabel>Default Shipping Method</InputLabel>
													<Select {...field} label="Default Shipping Method">
														<MenuItem value={null}>None</MenuItem>
														{shippingMethods.map((method) => (
															<MenuItem key={method} value={method}>
																{method}
															</MenuItem>
														))}
													</Select>
												</FormControl>
											)}
										/>
									</Grid>
									<Grid item xs={12} sm={6}>
										<Controller
											name="default_shipping_cost"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													label="Default Shipping Cost"
													type="number"
													fullWidth
													inputProps={{ min: 0, step: 0.01 }}
													value={field.value ?? ''}
												/>
											)}
										/>
									</Grid>
									<Grid item xs={12} sm={6}>
										<Controller
											name="processing_time_days"
											control={control}
											render={({ field }) => (
												<TextField
													{...field}
													label="Processing Time (days)"
													type="number"
													fullWidth
													inputProps={{ min: 0, max: 30 }}
												/>
											)}
										/>
									</Grid>
								</Grid>
							</CardContent>
						</Card>
					</Grid>

					{/* Auto Status Updates */}
					<Grid item xs={12}>
						<Card>
							<CardHeader title="Automatic Status Updates" />
							<CardContent>
								<Grid container spacing={2}>
									<Grid item xs={12}>
										<Controller
											name="auto_update_to_processing"
											control={control}
											render={({ field }) => (
												<FormControlLabel
													control={<Switch {...field} checked={field.value} />}
													label="Automatically update to 'Processing'"
												/>
											)}
										/>
									</Grid>
									{autoUpdateToProcessing && (
										<Grid item xs={12} sm={6}>
											<Controller
												name="auto_processing_delay_hours"
												control={control}
												render={({ field }) => (
													<TextField
														{...field}
														label="Delay before processing (hours)"
														type="number"
														fullWidth
														inputProps={{ min: 0, max: 720 }}
													/>
												)}
											/>
										</Grid>
									)}
									<Grid item xs={12}>
										<Controller
											name="auto_update_to_ready"
											control={control}
											render={({ field }) => (
												<FormControlLabel
													control={<Switch {...field} checked={field.value} />}
													label="Automatically update to 'Ready'"
												/>
											)}
										/>
									</Grid>
									{autoUpdateToReady && (
										<Grid item xs={12} sm={6}>
											<Controller
												name="auto_ready_delay_hours"
												control={control}
												render={({ field }) => (
													<TextField
														{...field}
														label="Delay before ready (hours)"
														type="number"
														fullWidth
														inputProps={{ min: 0, max: 720 }}
													/>
												)}
											/>
										</Grid>
									)}
								</Grid>
							</CardContent>
						</Card>
					</Grid>

					{/* Order Management */}
					<Grid item xs={12}>
						<Card>
							<CardHeader title="Order Management" />
							<CardContent>
								<Grid container spacing={2}>
									<Grid item xs={12}>
										<Controller
											name="auto_accept_orders"
											control={control}
											render={({ field }) => (
												<FormControlLabel
													control={<Switch {...field} checked={field.value} />}
													label="Automatically accept new orders"
												/>
											)}
										/>
									</Grid>
									<Grid item xs={12}>
										<Controller
											name="require_order_confirmation"
											control={control}
											render={({ field }) => (
												<FormControlLabel
													control={<Switch {...field} checked={field.value} />}
													label="Require order confirmation"
												/>
											)}
										/>
									</Grid>
									<Grid item xs={12}>
										<Controller
											name="allow_order_cancellation"
											control={control}
											render={({ field }) => (
												<FormControlLabel
													control={<Switch {...field} checked={field.value} />}
													label="Allow order cancellation"
												/>
											)}
										/>
									</Grid>
									{watch('allow_order_cancellation') && (
										<Grid item xs={12} sm={6}>
											<Controller
												name="cancellation_time_limit_hours"
												control={control}
												render={({ field }) => (
													<TextField
														{...field}
														label="Cancellation time limit (hours)"
														type="number"
														fullWidth
														inputProps={{ min: 0, max: 168 }}
													/>
												)}
											/>
										</Grid>
									)}
								</Grid>
							</CardContent>
						</Card>
					</Grid>

					{/* Submit Button */}
					<Grid item xs={12}>
						<Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
							<Button
								type="submit"
								variant="contained"
								color="primary"
								disabled={!isDirty || isUpdating}
							>
								{isUpdating ? 'Saving...' : 'Save Settings'}
							</Button>
						</Box>
					</Grid>
				</Grid>
			</form>

			<Snackbar
				open={showSuccessMessage}
				autoHideDuration={6000}
				onClose={() => setShowSuccessMessage(false)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
			>
				<Alert severity="success" onClose={() => setShowSuccessMessage(false)}>
					{message}
				</Alert>
			</Snackbar>

			<Snackbar
				open={showErrorMessage}
				autoHideDuration={6000}
				onClose={() => setShowErrorMessage(false)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
			>
				<Alert severity="error" onClose={() => setShowErrorMessage(false)}>
					{message}
				</Alert>
			</Snackbar>
		</Box>
	);
}

export default OrderSettings;






