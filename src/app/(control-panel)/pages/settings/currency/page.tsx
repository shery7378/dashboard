'use client';

import { useEffect, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Card,
	CardActions,
	CardContent,
	CardHeader,
	Container,
	MenuItem,
	Snackbar,
	TextField,
	Typography
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import { useGetAdminCurrencySettingsQuery, useUpdateAdminCurrencySettingsMutation } from './CurrencySettingsAdminApi';

// Simple list of common ISO currency codes for convenience
const COMMON_CURRENCIES = [
	'USD',
	'EUR',
	'GBP',
	'AED',
	'PKR',
	'INR',
	'SAR',
	'QAR',
	'KWD',
	'OMR',
	'CAD',
	'AUD',
	'CHF',
	'JPY',
	'CNY'
];

export default function CurrencySettingsPage() {
	const { data, isFetching, isError, error, refetch } = useGetAdminCurrencySettingsQuery(undefined, {
		refetchOnMountOrArgChange: true
	});

	const [updateSettings, { isLoading: isSaving }] = useUpdateAdminCurrencySettingsMutation();

	const [supportedText, setSupportedText] = useState('');
	const [defaultCurrency, setDefaultCurrency] = useState('');
	const [message, setMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	// Load data into local state
	useEffect(() => {
		const d = data?.data;

		if (!d) return;

		setSupportedText((d.supported_currencies || []).join(', '));
		setDefaultCurrency(d.default_currency || '');
	}, [data]);

	// Error from initial load
	useEffect(() => {
		if (isError && error) {
			const anyErr = error as any;
			setErrorMessage(anyErr?.data?.message || 'Failed to load currency settings.');
		}
	}, [isError, error]);

	const handleSave = async () => {
		try {
			const rawList = supportedText
				.split(',')
				.map((c) => c.trim().toUpperCase())
				.filter(Boolean);

			const uniqueSupported = Array.from(new Set(rawList));
			const def = defaultCurrency.trim().toUpperCase();

			if (!def) {
				setErrorMessage('Please set a default currency code (e.g. USD).');
				return;
			}

			if (uniqueSupported.length === 0) {
				setErrorMessage('Please add at least one supported currency (comma separated).');
				return;
			}

			if (!uniqueSupported.includes(def)) {
				uniqueSupported.push(def);
			}

			await updateSettings({
				supported_currencies: uniqueSupported,
				default_currency: def
			}).unwrap();

			setMessage('Currency settings updated successfully.');
			await refetch();
		} catch (e: any) {
			setErrorMessage(e?.data?.message || 'Failed to update currency settings.');
		}
	};

	const handleReload = async () => {
		try {
			await refetch();
			setMessage('Currency settings reloaded from server.');
		} catch {
			setErrorMessage('Failed to reload currency settings.');
		}
	};

	return (
		<>
			<Box
				sx={{
					minHeight: '100vh',
					background: 'linear-gradient(135deg, #020617 0%, #0f172a 40%, #1f2937 100%)',
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
							Currency Settings
						</Typography>
						<Typography
							variant="subtitle1"
							sx={{ opacity: 0.9 }}
						>
							Define which currencies are supported and choose a default currency for pricing.
						</Typography>
					</Box>

					{/* Card */}
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
											'radial-gradient(circle at 30% 30%, #38bdf8 0%, #0ea5e9 40%, #0284c7 100%)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										boxShadow: '0 10px 30px rgba(56,189,248,0.5)'
									}}
								>
									<CurrencyExchangeIcon sx={{ color: 'white', fontSize: 30 }} />
								</Box>
							}
							title={
								<Typography
									variant="h5"
									fontWeight={700}
								>
									Supported Currencies & Default
								</Typography>
							}
							subheader={
								<Typography
									variant="body2"
									sx={{ color: 'rgba(148,163,184,0.9)' }}
								>
									Example: supported = <strong>USD, GBP, EUR</strong>, default = <strong>USD</strong>.
									Prices are stored in the default currency and converted on the fly.
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
							{isFetching && !data && (
								<Alert
									severity="info"
									sx={{ backgroundColor: 'rgba(15,23,42,0.9)', color: 'white' }}
								>
									Loading currency settings…
								</Alert>
							)}

							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
								<TextField
									label="Supported Currencies (comma separated codes)"
									value={supportedText}
									onChange={(e) => setSupportedText(e.target.value)}
									fullWidth
									multiline
									minRows={2}
									placeholder="e.g. USD, GBP, EUR, AED"
									variant="outlined"
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: 2,
											backgroundColor: 'rgba(15,23,42,0.95)',
											color: 'white',
											'& fieldset': {
												borderColor: 'rgba(148,163,184,0.6)'
											},
											'&:hover fieldset': {
												borderColor: '#38bdf8'
											},
											'&.Mui-focused fieldset': {
												borderColor: '#38bdf8'
											}
										},
										'& .MuiInputLabel-root': {
											color: 'rgba(148,163,184,0.9)'
										},
										'& .MuiInputBase-input': {
											color: 'white'
										}
									}}
									helperText="Enter ISO currency codes separated by commas (case-insensitive)."
								/>

								<TextField
									select
									label="Default Currency"
									value={defaultCurrency}
									onChange={(e) => setDefaultCurrency(e.target.value)}
									fullWidth
									variant="outlined"
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: 2,
											backgroundColor: 'rgba(15,23,42,0.95)',
											color: 'white',
											'& fieldset': {
												borderColor: 'rgba(148,163,184,0.6)'
											},
											'&:hover fieldset': {
												borderColor: '#38bdf8'
											},
											'&.Mui-focused fieldset': {
												borderColor: '#38bdf8'
											}
										},
										'& .MuiInputLabel-root': {
											color: 'rgba(148,163,184,0.9)'
										},
										'& .MuiInputBase-input': {
											color: 'white'
										}
									}}
									helperText="This is the base currency your product prices are stored in."
								>
									{/* Default from supported list if available */}
									{supportedText
										.split(',')
										.map((c) => c.trim().toUpperCase())
										.filter(Boolean)
										.map((code) => (
											<MenuItem
												key={code}
												value={code}
											>
												{code}
											</MenuItem>
										))}

									{/* Fallback common options */}
									<MenuItem
										disabled
										value=""
									>
										─ Common Currencies ─
									</MenuItem>
									{COMMON_CURRENCIES.map((code) => (
										<MenuItem
											key={`common-${code}`}
											value={code}
										>
											{code}
										</MenuItem>
									))}
								</TextField>
							</Box>
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
								disabled={isSaving}
								sx={{
									borderRadius: 999,
									px: 4,
									py: 1.5,
									textTransform: 'none',
									fontWeight: 700,
									background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 40%, #0284c7 100%)',
									boxShadow: '0 10px 25px rgba(56,189,248,0.5)',
									'&:hover': {
										transform: 'translateY(-1px)',
										boxShadow: '0 14px 30px rgba(56,189,248,0.6)',
										background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 40%, #0284c7 100%)'
									}
								}}
							>
								{isSaving ? 'Saving…' : 'Save Settings'}
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
