'use client';

import { useState } from 'react';
import { Button, Card, CardContent, Grid, Typography, Box, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import {
	useGetWalletStatisticsQuery,
	useRequestPayoutMutation,
	useCreateStripeAccountMutation
} from './apis/WalletApi';
import './i18n';

interface PayoutsContentProps {
	walletData: any;
	onRefresh: () => void;
}

function PayoutsContent({ walletData, onRefresh }: PayoutsContentProps) {
	const { t } = useTranslation('payouts');
	const [showPayoutModal, setShowPayoutModal] = useState(false);
	const [payoutAmount, setPayoutAmount] = useState('');
	const [payoutError, setPayoutError] = useState('');
	const [success, setSuccess] = useState(false);
	const [showStripeEmailModal, setShowStripeEmailModal] = useState(false);
	const [stripeEmail, setStripeEmail] = useState('');
	const [stripeError, setStripeError] = useState('');

	const { data: statistics } = useGetWalletStatisticsQuery();
	const [requestPayout, { isLoading: payoutLoading }] = useRequestPayoutMutation();
	const [createStripeAccount, { isLoading: stripeLoading }] = useCreateStripeAccountMutation();

	const wallet = walletData?.wallet;
	const availableBalance = walletData?.available_balance || wallet?.balance || 0;
	const isStripeConnected = walletData?.is_stripe_connected;
	const stripeAccount = walletData?.stripe_account;
	const recentTransactions = walletData?.recent_transactions || [];

	const handlePayout = async () => {
		const amount = parseFloat(payoutAmount);
		const minPayout = 10.00;

		if (isNaN(amount) || amount < minPayout) {
			setPayoutError(t('minimum_payout_amount', { min: minPayout.toFixed(2) }));
			return;
		}

		if (amount > availableBalance) {
			setPayoutError(t('amount_exceeds_balance'));
			return;
		}

		try {
			setPayoutError('');
			await requestPayout({ amount }).unwrap();
			setSuccess(true);
			setShowPayoutModal(false);
			setPayoutAmount('');
			onRefresh();
			setTimeout(() => setSuccess(false), 3000);
		} catch (err: any) {
			setPayoutError(err?.data?.message || err?.message || t('failed_to_process_payout'));
		}
	};

	const formatCurrency = (amount: number) => {
		return `$${parseFloat(amount || 0).toFixed(2)}`;
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	return (
		<Box sx={{ py: 2 }}>
			{success && (
				<Alert severity="success" sx={{ mb: 2 }}>
					{t('payout_request_successful')}
				</Alert>
			)}

			{!isStripeConnected && (
				<Alert severity="warning" sx={{ mb: 2 }}>
					{t('connect_stripe_account')}
					<Button
						size="small"
						variant="contained"
						onClick={() => setShowStripeEmailModal(true)}
						sx={{ ml: 2 }}
					>
						{t('connect_stripe')}
					</Button>
				</Alert>
			)}

			{/* Stripe Email Input Dialog */}
			<Dialog 
				open={showStripeEmailModal} 
				onClose={() => {
					setShowStripeEmailModal(false);
					setStripeEmail('');
					setStripeError('');
				}}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>
					{t('connect_stripe_account')}
					<IconButton
						aria-label="close"
						onClick={() => {
							setShowStripeEmailModal(false);
							setStripeEmail('');
							setStripeError('');
						}}
						sx={{
							position: 'absolute',
							right: 8,
							top: 8,
						}}
					>
						<CloseIcon />
					</IconButton>
				</DialogTitle>
				<DialogContent>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
						Enter the email address associated with your Stripe account. If you don't have one, we'll help you create it.
					</Typography>
					<TextField
						autoFocus
						margin="dense"
						label="Stripe Account Email"
						type="email"
						fullWidth
						variant="outlined"
						value={stripeEmail}
						onChange={(e) => {
							setStripeEmail(e.target.value);
							setStripeError('');
						}}
						placeholder="your-email@example.com"
						error={!!stripeError}
						helperText={stripeError}
						disabled={stripeLoading}
					/>
				</DialogContent>
				<DialogActions>
					<Button 
						onClick={() => {
							setShowStripeEmailModal(false);
							setStripeEmail('');
							setStripeError('');
						}}
						disabled={stripeLoading}
					>
						Cancel
					</Button>
					<Button
						onClick={async () => {
							if (!stripeEmail.trim()) {
								setStripeError('Please enter a valid email address');
								return;
							}

							try {
								setStripeError('');
								const response = await createStripeAccount({ email: stripeEmail.trim() }).unwrap();
								setShowStripeEmailModal(false);
								setStripeEmail('');
								
								if (response.onboarding_url) {
									window.open(response.onboarding_url, '_blank');
								} else if (response.is_connected) {
									onRefresh();
								}
							} catch (err: any) {
								// Extract error message from various possible locations
								const errorMessage = 
									err?.data?.message || 
									err?.data?.error || 
									err?.message || 
									err?.error?.message ||
									'Failed to connect Stripe account. Please check the error details.';
								
								setStripeError(errorMessage);
								console.error('Error creating Stripe account:', {
									error: err,
									message: errorMessage,
									data: err?.data
								});
							}
						}}
						variant="contained"
						disabled={stripeLoading || !stripeEmail.trim()}
					>
						{stripeLoading ? 'Processing...' : 'Connect'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Balance Cards */}
			<Grid container spacing={3} sx={{ mb: 3 }}>
				<Grid item xs={12} sm={6} md={3}>
					<Card>
						<CardContent>
							<Typography color="textSecondary" gutterBottom>
								{t('available_balance')}
							</Typography>
							<Typography variant="h4" component="div">
								{formatCurrency(availableBalance)}
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<Card>
						<CardContent>
							<Typography color="textSecondary" gutterBottom>
								{t('total_earned')}
							</Typography>
							<Typography variant="h4" component="div">
								{formatCurrency(wallet?.total_earned || 0)}
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<Card>
						<CardContent>
							<Typography color="textSecondary" gutterBottom>
								{t('total_paid_out')}
							</Typography>
							<Typography variant="h4" component="div">
								{formatCurrency(wallet?.total_paid_out || 0)}
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<Card>
						<CardContent>
							<Typography color="textSecondary" gutterBottom>
								{t('pending')}
							</Typography>
							<Typography variant="h4" component="div">
								{formatCurrency(wallet?.pending_balance || 0)}
							</Typography>
						</CardContent>
					</Card>
				</Grid>
			</Grid>

			{/* Action Buttons */}
			<Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
				{isStripeConnected && parseFloat(availableBalance) > 0 && (
					<Button
						variant="contained"
						color="primary"
						onClick={() => setShowPayoutModal(true)}
					>
						{t('request_payout')}
					</Button>
				)}
				<Button variant="outlined" onClick={onRefresh}>
					{t('refresh')}
				</Button>
			</Box>

			{/* Statistics */}
			{statistics && (
				<Card sx={{ mb: 3 }}>
					<CardContent>
						<Typography variant="h6" gutterBottom>
							{t('statistics')}
						</Typography>
						<Grid container spacing={2}>
							<Grid item xs={6} md={3}>
								<Typography color="textSecondary" variant="body2">
									{t('today_earnings')}
								</Typography>
								<Typography variant="h6">
									{formatCurrency(statistics.today_earnings || 0)}
								</Typography>
							</Grid>
							<Grid item xs={6} md={3}>
								<Typography color="textSecondary" variant="body2">
									{t('this_month_earnings')}
								</Typography>
								<Typography variant="h6">
									{formatCurrency(statistics.month_earnings || 0)}
								</Typography>
							</Grid>
							<Grid item xs={6} md={3}>
								<Typography color="textSecondary" variant="body2">
									{t('last_month_earnings')}
								</Typography>
								<Typography variant="h6">
									{formatCurrency(statistics.last_month_earnings || 0)}
								</Typography>
							</Grid>
							<Grid item xs={6} md={3}>
								<Typography color="textSecondary" variant="body2">
									{t('this_month_payouts')}
								</Typography>
								<Typography variant="h6">
									{formatCurrency(statistics.month_payouts || 0)}
								</Typography>
							</Grid>
						</Grid>
					</CardContent>
				</Card>
			)}

			{/* Recent Transactions */}
			<Card>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						{t('recent_transactions')}
					</Typography>
					{recentTransactions.length === 0 ? (
						<Typography color="textSecondary">{t('no_transactions_found')}</Typography>
					) : (
						<Box sx={{ overflowX: 'auto' }}>
							<table style={{ width: '100%', borderCollapse: 'collapse' }}>
								<thead>
									<tr style={{ borderBottom: '1px solid #e0e0e0' }}>
										<th style={{ padding: '12px', textAlign: 'left' }}>{t('date')}</th>
										<th style={{ padding: '12px', textAlign: 'left' }}>{t('type')}</th>
										<th style={{ padding: '12px', textAlign: 'left' }}>{t('description')}</th>
										<th style={{ padding: '12px', textAlign: 'left' }}>{t('status')}</th>
										<th style={{ padding: '12px', textAlign: 'right' }}>{t('amount')}</th>
										<th style={{ padding: '12px', textAlign: 'right' }}>{t('balance_after')}</th>
									</tr>
								</thead>
								<tbody>
									{recentTransactions.map((transaction: any) => (
										<tr key={transaction.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
											<td style={{ padding: '12px' }}>{formatDate(transaction.created_at)}</td>
											<td style={{ padding: '12px' }}>
												<span style={{
													padding: '4px 8px',
													borderRadius: '4px',
													fontSize: '12px',
													backgroundColor: transaction.type === 'credit' ? '#e8f5e9' : '#ffebee',
													color: transaction.type === 'credit' ? '#2e7d32' : '#c62828'
												}}>
													{transaction.type === 'credit' ? t('credit') : t('debit')}
												</span>
											</td>
											<td style={{ padding: '12px' }}>{transaction.description || t('na')}</td>
											<td style={{ padding: '12px' }}>{transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}</td>
											<td style={{ padding: '12px', textAlign: 'right', color: transaction.type === 'credit' ? '#2e7d32' : '#c62828' }}>
												{transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
											</td>
											<td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrency(transaction.balance_after)}</td>
										</tr>
									))}
								</tbody>
							</table>
						</Box>
					)}
				</CardContent>
			</Card>

			{/* Payout Modal */}
			<Dialog open={showPayoutModal} onClose={() => setShowPayoutModal(false)} maxWidth="sm" fullWidth>
				<DialogTitle>
					{t('request_payout')}
					<IconButton
						onClick={() => setShowPayoutModal(false)}
						sx={{ position: 'absolute', right: 8, top: 8 }}
					>
						<CloseIcon />
					</IconButton>
				</DialogTitle>
				<DialogContent>
					<Box sx={{ pt: 2 }}>
						<TextField
							fullWidth
							label={t('payout_amount')}
							type="number"
							value={payoutAmount}
							onChange={(e) => setPayoutAmount(e.target.value)}
							inputProps={{ min: 10, max: availableBalance, step: 0.01 }}
							helperText={`${t('available')}: ${formatCurrency(availableBalance)} | ${t('minimum')}: $10.00`}
							sx={{ mb: 2 }}
						/>
						<Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
							<Button size="small" variant="outlined" onClick={() => setPayoutAmount((availableBalance * 0.25).toFixed(2))}>
								25%
							</Button>
							<Button size="small" variant="outlined" onClick={() => setPayoutAmount((availableBalance * 0.5).toFixed(2))}>
								50%
							</Button>
							<Button size="small" variant="outlined" onClick={() => setPayoutAmount((availableBalance * 0.75).toFixed(2))}>
								75%
							</Button>
							<Button size="small" variant="outlined" onClick={() => setPayoutAmount(availableBalance.toFixed(2))}>
								{t('all')}
							</Button>
						</Box>
						{payoutError && (
							<Alert severity="error" sx={{ mb: 2 }}>
								{payoutError}
							</Alert>
						)}
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setShowPayoutModal(false)}>{t('cancel')}</Button>
					<Button
						variant="contained"
						onClick={handlePayout}
						disabled={payoutLoading || !payoutAmount || parseFloat(payoutAmount) < 10 || parseFloat(payoutAmount) > availableBalance}
					>
						{payoutLoading ? t('processing') : t('request_payout')}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}

export default PayoutsContent;

