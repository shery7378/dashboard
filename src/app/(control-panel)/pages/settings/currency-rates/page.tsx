'use client';

import { useEffect, useMemo, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Card,
	CardActions,
	CardContent,
	CardHeader,
	CircularProgress,
	Container,
	Grid,
	Snackbar,
	TextField,
	Typography
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { useGetAdminCurrencyRatesQuery, useUpdateAdminCurrencyRatesMutation } from './CurrencyRatesAdminApi';

type LocalRates = Record<string, string>;

export default function CurrencyRatesSettingsPage() {
	const { data, isFetching, isError, error, refetch } = useGetAdminCurrencyRatesQuery(undefined, {
		refetchOnMountOrArgChange: true
	});

	const [updateRates, { isLoading: isSaving }] = useUpdateAdminCurrencyRatesMutation();

	const [localRates, setLocalRates] = useState<LocalRates>({});
	const [message, setMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const defaultCurrency = data?.default_currency || 'USD';

	// Initialize local editable rates from API data
	useEffect(() => {
		const apiRates = data?.rates || {};
		const supported = (data as any)?.supported_currencies as string[] | undefined;

		const initial: LocalRates = {};

		// Prefer explicit rates from API
		Object.entries(apiRates).forEach(([code, value]) => {
			initial[code] = value != null ? String(value) : '1';
		});

		// If no explicit rates yet but we have supported currencies, seed them with 1.0
		if (Object.keys(initial).length === 0 && Array.isArray(supported) && supported.length > 0) {
			supported.forEach((code) => {
				if (!initial[code]) {
					initial[code] = '1';
				}
			});
		}

		setLocalRates(initial);
	}, [data]);

	// Handle API load error
	useEffect(() => {
		if (isError && error) {
			const anyErr = error as any;
			setErrorMessage(anyErr?.data?.message || 'Failed to load currency rates.');
		}
	}, [isError, error]);

	const hasRates = useMemo(() => localRates && Object.keys(localRates).length > 0, [localRates]);

	const handleRateChange = (code: string, value: string) => {
		setLocalRates((prev) => ({
			...prev,
			[code]: value
		}));
	};

	const handleSave = async () => {
		try {
			const numericRates: Record<string, number> = {};

			Object.entries(localRates).forEach(([code, value]) => {
				const parsed = parseFloat(value.replace(',', '.'));

				if (!Number.isNaN(parsed) && parsed >= 0) {
					numericRates[code] = parsed;
				}
			});

			if (Object.keys(numericRates).length === 0) {
				setErrorMessage('Please enter at least one valid rate.');
				return;
			}

			await updateRates({ rates: numericRates }).unwrap();
			setMessage('Currency rates updated successfully.');
			await refetch();
		} catch (e: any) {
			setErrorMessage(e?.data?.message || 'Failed to update currency rates.');
		}
	};

	const handleReload = async () => {
		try {
			await refetch();
			setMessage('Currency rates reloaded from server.');
		} catch {
			setErrorMessage('Failed to reload currency rates.');
		}
	};

	return (
		<>
			<Box
				sx={{
					minHeight: '100vh',
					background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #4b5563 100%)',
					py: 6
				}}
			>
				<Container maxWidth="md">
					{/* Header */}
					<Box
						sx={{
							mb: 4,
							textAlign: 'center',
							color: 'white'
						}}
					>
						<Typography
							variant="h3"
							fontWeight={800}
							gutterBottom
						>
							Currency Rates
						</Typography>
						<Typography
							variant="subtitle1"
							sx={{ opacity: 0.9 }}
						>
							Set exchange rates for each supported currency relative to your default currency (
							<strong>{defaultCurrency}</strong>).
						</Typography>
					</Box>

					{/* Main Card */}
					<Card
						elevation={8}
						sx={{
							borderRadius: 4,
							overflow: 'hidden',
							background: 'rgba(15,23,42,0.98)',
							border: '1px solid rgba(148,163,184,0.35)',
							color: 'white'
						}}
					>
						<CardHeader
							avatar={
								<Box
									sx={{
										width: 56,
										height: 56,
										borderRadius: '999px',
										background:
											'radial-gradient(circle at 30% 30%, #22c55e 0%, #16a34a 40%, #15803d 100%)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										boxShadow: '0 10px 30px rgba(34,197,94,0.45)'
									}}
								>
									<AttachMoneyIcon sx={{ color: 'white', fontSize: 30 }} />
								</Box>
							}
							title={
								<Typography
									variant="h5"
									fontWeight={700}
								>
									Manage Exchange Rates
								</Typography>
							}
							subheader={
								<Typography
									variant="body2"
									sx={{ color: 'rgba(148,163,184,0.9)' }}
								>
									Example: if default currency is {defaultCurrency} and you set USD = 1.25, then 1{' '}
									{defaultCurrency} = 1.25 USD.
								</Typography>
							}
							sx={{
								pb: 0,
								'& .MuiCardHeader-subheader': {
									mt: 1
								}
							}}
						/>

						<CardContent sx={{ pt: 3 }}>
							{isFetching && !hasRates && (
								<Box
									sx={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										py: 8
									}}
								>
									<CircularProgress />
								</Box>
							)}

							{!isFetching && !hasRates && (
								<Alert
									severity="info"
									sx={{ backgroundColor: 'rgba(15,23,42,0.9)', color: 'white' }}
								>
									No currencies configured yet. Please add supported currencies and a default currency
									on the Currency Settings page, then reload this page.
								</Alert>
							)}

							{hasRates && (
								<Grid
									container
									spacing={3}
								>
									{Object.entries(localRates).map(([code, value]) => (
										<Grid
											item
											xs={12}
											md={6}
											key={code}
										>
											<TextField
												label={`${code} rate`}
												value={value}
												onChange={(e) => handleRateChange(code, e.target.value)}
												fullWidth
												variant="outlined"
												type="number"
												inputProps={{ min: 0, step: '0.0001' }}
												sx={{
													'& .MuiOutlinedInput-root': {
														borderRadius: 2,
														backgroundColor: 'rgba(15,23,42,0.95)',
														color: 'white',
														'& fieldset': {
															borderColor: 'rgba(148,163,184,0.6)'
														},
														'&:hover fieldset': {
															borderColor: '#22c55e'
														},
														'&.Mui-focused fieldset': {
															borderColor: '#22c55e'
														}
													},
													'& .MuiInputLabel-root': {
														color: 'rgba(148,163,184,0.9)'
													},
													'& .MuiInputBase-input': {
														color: 'white'
													}
												}}
												helperText={`How many ${code} is equal to 1 ${defaultCurrency}`}
											/>
										</Grid>
									))}
								</Grid>
							)}
						</CardContent>

						<CardActions
							sx={{
								justifyContent: 'flex-end',
								p: 3,
								gap: 2,
								borderTop: '1px solid rgba(51,65,85,0.8)',
								background: 'linear-gradient(to right, rgba(15,23,42,1), rgba(15,23,42,0.95))'
							}}
						>
							<Button
								variant="outlined"
								startIcon={<RestartAltOutlinedIcon />}
								onClick={handleReload}
								disabled={isFetching}
								sx={{
									borderRadius: 999,
									px: 3,
									textTransform: 'none',
									fontWeight: 600,
									borderColor: 'rgba(148,163,184,0.7)',
									color: 'rgba(248,250,252,0.9)',
									'&:hover': {
										borderColor: '#e5e7eb',
										backgroundColor: 'rgba(15,23,42,0.8)'
									}
								}}
							>
								Reload
							</Button>

							<Button
								variant="contained"
								startIcon={<SaveOutlinedIcon />}
								onClick={handleSave}
								disabled={isSaving || !hasRates}
								sx={{
									borderRadius: 999,
									px: 4,
									py: 1.5,
									textTransform: 'none',
									fontWeight: 700,
									background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 40%, #15803d 100%)',
									boxShadow: '0 10px 25px rgba(34,197,94,0.5)',
									'&:hover': {
										transform: 'translateY(-1px)',
										boxShadow: '0 14px 30px rgba(34,197,94,0.6)',
										background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 40%, #15803d 100%)'
									}
								}}
							>
								{isSaving ? 'Saving…' : 'Save Rates'}
							</Button>
						</CardActions>
					</Card>
				</Container>
			</Box>

			{/* Notifications */}
			<Snackbar
				open={!!message}
				autoHideDuration={3000}
				onClose={() => setMessage(null)}
			>
				<Alert
					severity="success"
					variant="filled"
					onClose={() => setMessage(null)}
				>
					{message}
				</Alert>
			</Snackbar>

			<Snackbar
				open={!!errorMessage}
				autoHideDuration={4000}
				onClose={() => setErrorMessage(null)}
			>
				<Alert
					severity="error"
					variant="filled"
					onClose={() => setErrorMessage(null)}
				>
					{errorMessage}
				</Alert>
			</Snackbar>
		</>
	);
}
