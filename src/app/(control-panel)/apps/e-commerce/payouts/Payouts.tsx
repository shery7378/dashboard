'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import GlobalStyles from '@mui/material/GlobalStyles';
import PayoutsHeader from './PayoutsHeader';
import PayoutsContent from './PayoutsContent';
import { useGetWalletQuery } from './apis/WalletApi';
import FuseLoading from '@fuse/core/FuseLoading';
import { Alert, Snackbar } from '@mui/material';
import { useTranslation } from 'react-i18next';
import './i18n';

/**
 * The payouts page.
 */
function Payouts() {
	const { t } = useTranslation('payouts');
	const { data: walletData, isLoading, error, refetch } = useGetWalletQuery();
	const [showSuccessMessage, setShowSuccessMessage] = useState(false);
	const searchParams = useSearchParams();
	const router = useRouter();

	// Handle success query parameter from Stripe Connect redirect
	useEffect(() => {
		const success = searchParams.get('success');
		const stripeRefresh = searchParams.get('stripe_refresh');
		
		if (success === 'true') {
			setShowSuccessMessage(true);
			// Refresh wallet data to get updated Stripe account status
			refetch();
			// Clean up URL after showing message
			setTimeout(() => {
				router.replace('/apps/e-commerce/payouts');
				setShowSuccessMessage(false);
			}, 5000);
		}
		
		if (stripeRefresh === 'true') {
			// Refresh wallet data when user returns from Stripe onboarding
			refetch();
			// Clean up URL
			setTimeout(() => {
				router.replace('/apps/e-commerce/payouts');
			}, 1000);
		}
	}, [searchParams, router, refetch]);

	return (
		<>
			<GlobalStyles
				styles={() => ({
					'#root': {
						maxHeight: '100vh'
					}
				})}
			/>
			<Snackbar
				open={showSuccessMessage}
				autoHideDuration={5000}
				onClose={() => {
					setShowSuccessMessage(false);
					router.replace('/apps/e-commerce/payouts');
				}}
				anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
			>
				<Alert 
					onClose={() => {
						setShowSuccessMessage(false);
						router.replace('/apps/e-commerce/payouts');
					}} 
					severity="success" 
					sx={{ width: '100%' }}
				>
					{t('stripe_account_connected', 'Stripe Account Connected! Your Stripe Connect account has been successfully set up. You can now request payouts.')}
				</Alert>
			</Snackbar>
			<div className="w-full h-full flex flex-col px-4">
				<PayoutsHeader />
				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<FuseLoading />
					</div>
				) : error ? (
					<div className="m-4">
						<Alert severity="error">
							{'data' in error && error.data && typeof error.data === 'object' && 'message' in error.data
								? (error.data as any).message
								: t('failed_to_load_wallet')}
						</Alert>
					</div>
				) : (
					<PayoutsContent walletData={walletData} onRefresh={refetch} />
				)}
			</div>
		</>
	);
}

export default Payouts;

