import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { darken } from '@mui/material/styles';
import PageBreadcrumb from 'src/components/PageBreadcrumb';
import useUser from '@auth/useUser';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import apiFetchLaravel from '@/utils/apiFetchLaravel';
import { useSession } from 'next-auth/react';

/**
 * The VendorDashboardAppHeader component.
 */
function VendorDashboardAppHeader() {
	const { data: user, isGuest, updateUser } = useUser();
	const { data: session } = useSession();

	const [openStoreDialog, setOpenStoreDialog] = useState(false);
	const [checkingStore, setCheckingStore] = useState(true);

	// Check store on mount - more robust check
	useEffect(() => {
		async function checkStore() {
			if (!user || isGuest) {
				setCheckingStore(false);
				return;
			}

			console.log('SellerDashboardAppHeader - User object:', user);
			console.log('SellerDashboardAppHeader - User store_id:', user.store_id);

			// If store_id is already present, no need to check
			// Check for store_id as string, number, or truthy value
			const hasStoreId = user.store_id !== null && user.store_id !== undefined && user.store_id !== '';
			if (hasStoreId) {
				console.log('Store ID found in user object:', user.store_id);
				setCheckingStore(false);
				setOpenStoreDialog(false);
				return;
			}

			console.log('Store ID not found, checking API...');

			// Try to fetch current store from API
			try {
				const accessToken = session?.accessAuthToken;
				if (!accessToken) {
					console.log('No access token available');
					setCheckingStore(false);
					// Wait a bit for token to be available
					setTimeout(() => {
						if (!user.store_id) {
							setOpenStoreDialog(true);
						}
					}, 1000);
					return;
				}

				console.log('Fetching store from API...');
				const response = await apiFetchLaravel('/api/store/current', {
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
					credentials: 'include'
				});

				console.log('Store API response status:', response.status);

				if (response.ok) {
					const storeData = await response.json();
					console.log('Store data received:', storeData);
					const storeId = storeData?.data?.id || storeData?.data?.id?.toString();
					if (storeId) {
						// Store exists - just update the session, don't try to update via API
						console.log('Store found with ID:', storeId);
						// Update local state to prevent dialog from showing
						setCheckingStore(false);
						setOpenStoreDialog(false);
						// Update session directly without API call
						// The store_id will be available on next page load from the token
						return;
					}
				} else if (response.status === 404) {
					// Store not found - this is expected if user doesn't have a store
					console.log('Store not found (404) - user needs to create a store');
					setCheckingStore(false);
					setOpenStoreDialog(true);
					return;
				}

				// Other error - don't show dialog, just log
				console.warn('Store check failed with status:', response.status);
				setCheckingStore(false);
			} catch (error) {
				console.error('Error checking store:', error);
				// On error, don't show dialog immediately - might be a network issue
				setCheckingStore(false);
			}
		}

		checkStore();
	}, [user, isGuest, session, updateUser]);

	return (
		<div className="flex flex-col w-full px-6 sm:px-8">
			<div className="flex flex-col sm:flex-row flex-auto sm:items-center min-w-0 my-8 sm:my-12">
				<div className="flex flex-auto items-start min-w-0">
					<Avatar
						sx={(theme) => ({
							background: (theme) => darken(theme.palette.background.default, 0.05),
							color: theme.vars.palette.text.secondary
						})}
						className="shrink-0 w-16 h-16 mt-1"
						alt="user photo"
						src={
							user?.profile?.image
								? `${process.env.NEXT_PUBLIC_API_URL}/${user.profile.image}`
								: '/assets/images/avatars/default-avatar.png'
						}
					>
						{!user?.profile?.image && user?.displayName?.[0]}
					</Avatar>
					<div className="flex flex-col min-w-0 mx-4">
						<PageBreadcrumb />
						<Typography className="text-2xl md:text-5xl font-semibold tracking-tight leading-7 md:leading-[1.375] truncate">
							{isGuest ? 'Hi Guest!' : `Welcome back, ${user?.displayName || user?.email}!`}
						</Typography>

						<div className="flex items-center">
							<FuseSvgIcon
								size={20}
								color="action"
							>
								heroicons-solid:shopping-bag
							</FuseSvgIcon>
							<Typography
								className="mx-1.5 leading-6 truncate"
								color="text.secondary"
							>
								{user?.role?.includes('supplier')
									? 'Supplier Dashboard'
									: 'Seller Dashboard - Direct Sales'}
							</Typography>
						</div>
					</div>
				</div>
			</div>
			<Dialog open={openStoreDialog && !checkingStore}>
				<DialogTitle>
					Store Required
					<IconButton
						aria-label="close"
						onClick={() => setOpenStoreDialog(false)}
						sx={{
							position: 'absolute',
							right: 8,
							top: 8,
							color: (theme) => theme.palette.grey[500],
						}}
					>
						<CloseIcon />
					</IconButton>
				</DialogTitle>
				<DialogContent>
					<Typography>
						Please add a store before proceeding.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button
						variant="outlined"
						onClick={() => setOpenStoreDialog(false)}
					>
						Cancel
					</Button>
					<Button
						variant="contained"
						color="primary"
						onClick={() => {
							setOpenStoreDialog(false);
							window.location.href = '/apps/e-commerce/stores/new';
						}}
					>
						Add Store
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}

export default VendorDashboardAppHeader;

