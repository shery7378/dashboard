'use client';

import { useState, useEffect } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	FormControlLabel,
	Switch,
	Alert,
	Box,
	Typography,
	Divider,
	Paper,
	Card,
	CardContent,
	Grid,
	InputAdornment,
	IconButton,
	Tooltip
} from '@mui/material';
import { useSnackbar } from 'notistack';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import {
	useGetLoyaltyPointsSettingsQuery,
	useUpdateLoyaltyPointsSettingsMutation
} from './apis/LoyaltyPointsApi';

interface LoyaltyPointsSettings {
	loyalty_points_enabled: boolean;
	loyalty_points_per_dollar: number;
	loyalty_points_dollar_per_point: number;
	loyalty_points_min_redemption: number;
	loyalty_points_expiration_days: number | null;
}

interface LoyaltyPointsSettingsDialogProps {
	open: boolean;
	onClose: () => void;
}

function LoyaltyPointsSettingsDialog({ open, onClose }: LoyaltyPointsSettingsDialogProps) {
	const { enqueueSnackbar } = useSnackbar();
	const [defaultCurrency, setDefaultCurrency] = useState('USD');
	const [currencySymbol, setCurrencySymbol] = useState('$');
	const [settings, setSettings] = useState<LoyaltyPointsSettings>({
		loyalty_points_enabled: false,
		loyalty_points_per_dollar: 1.0,
		loyalty_points_dollar_per_point: 0.01,
		loyalty_points_min_redemption: 100,
		loyalty_points_expiration_days: null,
	});

	// Use the API hook instead of manual axios calls
	// Always call the hook (don't skip) to maintain consistent hook count
	const { data, isLoading, error, refetch } = useGetLoyaltyPointsSettingsQuery(undefined, {
		refetchOnMountOrArgChange: true,
	});

	const [updateSettings, { isLoading: saving }] = useUpdateLoyaltyPointsSettingsMutation();

	// Update currency when settings are loaded
	useEffect(() => {
		if (data?.data) {
			if (data.data.default_currency) {
				setDefaultCurrency(data.data.default_currency);
			}
			if (data.data.currency_symbol) {
				setCurrencySymbol(data.data.currency_symbol);
			}
		}
	}, [data]);

	const getCurrencySymbol = (currency: string): string => {
		const symbols: Record<string, string> = {
			USD: '$',
			GBP: '£',
			EUR: '€',
			JPY: '¥',
			CAD: 'C$',
			AUD: 'A$',
			INR: '₹',
			CNY: '¥',
		};
		return symbols[currency] || currency;
	};

	// Update local state when data is fetched and dialog is open
	useEffect(() => {
		if (data?.data && open) {
			console.log('🟢 Dialog: Settings loaded from API:', data.data);
			setSettings(data.data);
		}
	}, [data, open]);

	const handleSave = async () => {
		try {
			console.log('🔵 Saving settings:', settings);
			console.log('🔵 loyalty_points_enabled value:', settings.loyalty_points_enabled, typeof settings.loyalty_points_enabled);
			
			const result = await updateSettings(settings).unwrap();
			console.log('🟢 Save response:', result);
			console.log('🟢 Response data:', result?.data);
			console.log('🟢 Response enabled status:', result?.data?.loyalty_points_enabled);
			
			// Update local state immediately with the response data
			if (result?.data) {
				console.log('🟡 Updating local state with:', result.data);
				setSettings(result.data);
			}
			
			// Immediately refetch settings to get latest data from server
			console.log('🟠 Refetching settings...');
			const refetchResult = await refetch();
			console.log('🟣 Refetch result:', refetchResult);
			console.log('🟣 Refetch data:', refetchResult?.data);
			console.log('🟣 Refetch enabled status:', refetchResult?.data?.data?.loyalty_points_enabled);
			
			enqueueSnackbar('Settings saved successfully', { variant: 'success' });
			
			// Close dialog after a delay to allow refetch to complete
			setTimeout(() => {
				onClose();
			}, 300);
		} catch (err: any) {
			console.error('🔴 Error saving settings:', err);
			console.error('🔴 Error details:', err?.data, err?.message);
			enqueueSnackbar(err?.data?.message || err?.message || 'Failed to save settings', { variant: 'error' });
		}
	};

	const handleChange = (field: keyof LoyaltyPointsSettings, value: any) => {
		setSettings((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	// Calculate examples
	const exampleOrderAmount = 50;
	const pointsEarned = Math.floor(exampleOrderAmount * settings.loyalty_points_per_dollar);
	const discountAmount = settings.loyalty_points_min_redemption * settings.loyalty_points_dollar_per_point;

	return (
		<Dialog 
			open={open} 
			onClose={onClose} 
			maxWidth="lg" 
			fullWidth
			disableEscapeKeyDown={false}
			disableAutoFocus={false}
			disableEnforceFocus={true}
			disableRestoreFocus={false}
			aria-labelledby="loyalty-points-settings-dialog-title"
			aria-describedby="loyalty-points-settings-dialog-description"
			onEntering={() => {
				// Remove focus from any background elements before dialog opens
				if (document.activeElement && document.activeElement instanceof HTMLElement) {
					document.activeElement.blur();
				}
			}}
			onEntered={() => {
				// Ensure focus is properly managed after dialog opens
				// This prevents the aria-hidden warning by ensuring focus is inside the dialog
				setTimeout(() => {
					const dialogContent = document.querySelector('[role="dialog"]') as HTMLElement;
					if (dialogContent) {
						const firstFocusable = dialogContent.querySelector('input:not([disabled]), button:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])') as HTMLElement;
						if (firstFocusable) {
							firstFocusable.focus();
						} else {
							// If no focusable element found, focus the dialog itself
							dialogContent.focus();
						}
					}
				}, 50);
			}}
			PaperProps={{
				sx: {
					'&:focus': {
						outline: 'none'
					}
				}
			}}
		>
			<DialogTitle id="loyalty-points-settings-dialog-title" sx={{ pb: 1 }}>
				<Box display="flex" alignItems="center" gap={1}>
					<FuseSvgIcon className="text-primary" size={28}>heroicons-outline:star</FuseSvgIcon>
					<Typography variant="h5" component="span" fontWeight="bold">
						Loyalty Points Configuration
					</Typography>
				</Box>
			</DialogTitle>
			<DialogContent>
				{isLoading ? (
					<Box sx={{ p: 4, textAlign: 'center' }}>
						<Typography color="text.secondary">Loading settings...</Typography>
					</Box>
				) : error ? (
					<Alert severity="error" sx={{ mb: 2 }}>
						{(error as any)?.data?.message || (error as any)?.message || 'Failed to load settings'}
					</Alert>
				) : (
					<Box sx={{ pt: 1 }}>
						{/* Enable/Disable Toggle */}
						<Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
							<FormControlLabel
								control={
									<Switch
										checked={settings.loyalty_points_enabled}
										onChange={(e) => handleChange('loyalty_points_enabled', e.target.checked)}
										color="primary"
										size="medium"
									/>
								}
								label={
									<Box>
										<Typography variant="h6" fontWeight="600">
											Enable Loyalty Points System
										</Typography>
										<Typography variant="body2" color="text.secondary">
											Activate the loyalty points program for your customers
										</Typography>
									</Box>
								}
							/>
						</Paper>

						{settings.loyalty_points_enabled && (
							<>
								<Divider sx={{ my: 3 }} />

								{/* Earning Settings */}
								<Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: 'primary.main' }}>
									<FuseSvgIcon size={20} sx={{ mr: 1, verticalAlign: 'middle' }}>heroicons-outline:gift</FuseSvgIcon>
									Points Earning
								</Typography>
								
								<Grid container spacing={3} sx={{ mb: 4 }}>
									<Grid item xs={12} md={6}>
										<Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
											<CardContent>
												<Typography variant="subtitle2" color="text.secondary" gutterBottom>
													Points Per {defaultCurrency}
												</Typography>
												<TextField
													fullWidth
													type="number"
													value={settings.loyalty_points_per_dollar}
													onChange={(e) => handleChange('loyalty_points_per_dollar', parseFloat(e.target.value) || 0)}
													inputProps={{ step: 0.01, min: 0 }}
													InputProps={{
														endAdornment: (
															<InputAdornment position="end">
																<Tooltip title="Points awarded per currency unit spent">
																	<IconButton size="small" edge="end">
																		<FuseSvgIcon size={16}>heroicons-outline:information-circle</FuseSvgIcon>
																	</IconButton>
																</Tooltip>
															</InputAdornment>
														),
													}}
													sx={{ mt: 1 }}
												/>
												<Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
													Example: {settings.loyalty_points_per_dollar} point{settings.loyalty_points_per_dollar !== 1 ? 's' : ''} per {currencySymbol}1 spent
												</Typography>
											</CardContent>
										</Card>
									</Grid>
									<Grid item xs={12} md={6}>
										<Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
											<CardContent>
												<Typography variant="subtitle2" color="text.secondary" gutterBottom>
													Minimum Redemption
												</Typography>
												<TextField
													fullWidth
													type="number"
													value={settings.loyalty_points_min_redemption}
													onChange={(e) => handleChange('loyalty_points_min_redemption', parseInt(e.target.value) || 0)}
													inputProps={{ min: 1 }}
													InputProps={{
														endAdornment: (
															<InputAdornment position="end">
																<Typography variant="body2" color="text.secondary">points</Typography>
															</InputAdornment>
														),
													}}
													sx={{ mt: 1 }}
												/>
												<Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
													Minimum points required to redeem
												</Typography>
											</CardContent>
										</Card>
									</Grid>
								</Grid>

								{/* Redemption Settings */}
								<Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 3, color: 'primary.main' }}>
									<FuseSvgIcon size={20} sx={{ mr: 1, verticalAlign: 'middle' }}>heroicons-outline:shopping-cart</FuseSvgIcon>
									Points Redemption
								</Typography>

								<Grid container spacing={3} sx={{ mb: 4 }}>
									<Grid item xs={12} md={6}>
										<Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
											<CardContent>
												<Typography variant="subtitle2" color="text.secondary" gutterBottom>
													{defaultCurrency} Per Point
												</Typography>
												<TextField
													fullWidth
													type="number"
													value={settings.loyalty_points_dollar_per_point}
													onChange={(e) => handleChange('loyalty_points_dollar_per_point', parseFloat(e.target.value) || 0)}
													inputProps={{ step: 0.001, min: 0 }}
													InputProps={{
														startAdornment: (
															<InputAdornment position="start">
																<Typography variant="body2">{currencySymbol}</Typography>
															</InputAdornment>
														),
														endAdornment: (
															<InputAdornment position="end">
																<Tooltip title="Currency value per point">
																	<IconButton size="small" edge="end">
																		<FuseSvgIcon size={16}>heroicons-outline:information-circle</FuseSvgIcon>
																	</IconButton>
																</Tooltip>
															</InputAdornment>
														),
													}}
													sx={{ mt: 1 }}
												/>
												<Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
													{Math.round(1 / settings.loyalty_points_dollar_per_point)} points = {currencySymbol}1 discount
												</Typography>
											</CardContent>
										</Card>
									</Grid>
									<Grid item xs={12} md={6}>
										<Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
											<CardContent>
												<Typography variant="subtitle2" color="text.secondary" gutterBottom>
													Expiration Days
												</Typography>
												<TextField
													fullWidth
													type="number"
													value={settings.loyalty_points_expiration_days || ''}
													onChange={(e) => handleChange('loyalty_points_expiration_days', e.target.value ? parseInt(e.target.value) : null)}
													inputProps={{ min: 1 }}
													placeholder="Never expire"
													InputProps={{
														endAdornment: (
															<InputAdornment position="end">
																<Typography variant="body2" color="text.secondary">days</Typography>
															</InputAdornment>
														),
													}}
													sx={{ mt: 1 }}
												/>
												<Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
													Leave empty for points that never expire
												</Typography>
											</CardContent>
										</Card>
									</Grid>
								</Grid>

								{/* Example Calculation */}
								<Alert 
									severity="info" 
									icon={<FuseSvgIcon>heroicons-outline:calculator</FuseSvgIcon>}
									sx={{ 
										mt: 3,
										'& .MuiAlert-message': {
											width: '100%'
										}
									}}
								>
									<Typography variant="subtitle2" fontWeight="600" gutterBottom>
										Example Calculation ({defaultCurrency})
									</Typography>
									<Grid container spacing={2} sx={{ mt: 1 }}>
										<Grid item xs={12} sm={6}>
											<Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
												<Typography variant="body2" color="text.secondary">Order Value</Typography>
												<Typography variant="h6" color="success.main">
													{currencySymbol}{exampleOrderAmount}
												</Typography>
												<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
													= <strong>{pointsEarned} points</strong> earned
												</Typography>
											</Box>
										</Grid>
										<Grid item xs={12} sm={6}>
											<Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
												<Typography variant="body2" color="text.secondary">Redemption</Typography>
												<Typography variant="h6" color="warning.main">
													{settings.loyalty_points_min_redemption} points
												</Typography>
												<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
													= <strong>{currencySymbol}{discountAmount.toFixed(2)}</strong> discount
												</Typography>
											</Box>
										</Grid>
									</Grid>
								</Alert>
							</>
						)}
					</Box>
				)}
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2, pt: 2 }}>
				<Button onClick={onClose} disabled={saving} size="large">
					Cancel
				</Button>
				<Button 
					onClick={handleSave} 
					variant="contained" 
					color="primary" 
					disabled={saving || isLoading}
					size="large"
					startIcon={<FuseSvgIcon>heroicons-outline:check</FuseSvgIcon>}
				>
					{saving ? 'Saving...' : 'Save Settings'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default LoyaltyPointsSettingsDialog;
