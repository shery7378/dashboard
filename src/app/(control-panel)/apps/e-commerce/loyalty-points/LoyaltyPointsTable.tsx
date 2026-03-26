'use client';

import { useMemo, useState, useEffect } from 'react';
import { type MRT_ColumnDef } from 'material-react-table';
import DataTable from 'src/components/data-table/DataTable';
import {
	ListItemIcon,
	MenuItem,
	Paper,
	Typography,
	Chip,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Alert,
	Card,
	CardContent,
	Grid,
	Box
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useSnackbar } from 'notistack';
import {
	useGetLoyaltyPointsQuery,
	useAdjustUserPointsMutation,
	useGetLoyaltyPointsSettingsQuery,
	type LoyaltyPoint
} from './apis/LoyaltyPointsApi';
import LoyaltyPointsSettingsDialog from './LoyaltyPointsSettingsDialog';
import { formatDate } from '@/utils/Constants';

interface LoyaltyPointsTableProps {
	settingsDialogOpen?: boolean;
	onSettingsDialogClose?: () => void;
	onSettingsDialogOpen?: () => void;
}

/**
 * Table showing loyalty points transactions with points adjustment and settings functionality.
 */
function LoyaltyPointsTable({
	settingsDialogOpen = false,
	onSettingsDialogClose,
	onSettingsDialogOpen
}: LoyaltyPointsTableProps) {
	const { enqueueSnackbar } = useSnackbar();
	const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState<{
		id: number;
		name: string;
		email: string;
		balance: number;
	} | null>(null);
	const [adjustPoints, setAdjustPoints] = useState('');
	const [adjustDescription, setAdjustDescription] = useState('');
	const [filters, setFilters] = useState({
		user_id: undefined as number | undefined,
		type: '' as '' | 'earned' | 'redeemed' | 'expired' | 'adjusted',
		date_from: '',
		date_to: ''
	});

	const { data, isLoading, error } = useGetLoyaltyPointsQuery({
		user_id: filters.user_id,
		type: filters.type || undefined,
		date_from: filters.date_from || undefined,
		date_to: filters.date_to || undefined
	});

	const {
		data: settingsData,
		isLoading: isLoadingSettingsQuery
	} = useGetLoyaltyPointsSettingsQuery(undefined, {
		refetchOnMountOrArgChange: true,
		refetchOnFocus: true
	});

	const [adjustUserPoints] = useAdjustUserPointsMutation();

	const loyaltyPoints = data?.data?.loyaltyPoints?.data || [];
	const stats = data?.data?.stats || {
		total_earned: 0,
		total_redeemed: 0,
		total_expired: 0,
		total_adjusted: 0,
		current_balance: 0
	};

	const handleAdjustPoints = async () => {
		if (!selectedUser || !adjustPoints || !adjustDescription.trim()) {
			enqueueSnackbar('Please fill in all fields', { variant: 'warning' });
			return;
		}

		try {
			await adjustUserPoints({
				userId: selectedUser.id,
				points: parseInt(adjustPoints),
				description: adjustDescription
			}).unwrap();

			enqueueSnackbar('Points adjusted successfully', { variant: 'success' });
			setAdjustDialogOpen(false);
			setAdjustPoints('');
			setAdjustDescription('');
			setSelectedUser(null);
		} catch (err: any) {
			console.error('Error adjusting points:', err);
			enqueueSnackbar(err?.data?.message || err?.message || 'Failed to adjust points', { variant: 'error' });
		}
	};

	const currentSettings = settingsData?.data;
	const currencySymbol = currentSettings?.currency_symbol || '$';
	const defaultCurrency = currentSettings?.default_currency || 'USD';
	const isLoadingSettings = isLoadingSettingsQuery || (!settingsData && !error);

	const normalizedSettings = currentSettings
		? {
				...currentSettings,
				loyalty_points_enabled: !!(
					currentSettings.loyalty_points_enabled === true ||
					currentSettings.loyalty_points_enabled === 'true' ||
					currentSettings.loyalty_points_enabled === 1 ||
					currentSettings.loyalty_points_enabled === '1'
				)
			}
		: null;

	const displaySettings = normalizedSettings || {
		loyalty_points_enabled: false,
		loyalty_points_per_dollar: 1.0,
		loyalty_points_dollar_per_point: 0.01,
		loyalty_points_min_redemption: 100,
		loyalty_points_expiration_days: null,
		currency_symbol: '$',
		default_currency: 'USD'
	};

	const columns = useMemo<MRT_ColumnDef<LoyaltyPoint>[]>(
		() => [
			{
				accessorKey: 'id',
				header: 'ID',
				size: 80,
				Cell: ({ row }) => <span className="font-mono text-gray-400">#{row.original.id}</span>
			},
			{
				accessorKey: 'user',
				header: 'User',
				size: 220,
				Cell: ({ row }) => {
					const user = row.original.user;
					if (!user) return <span className="text-gray-400">—</span>;
					return (
						<div className="flex flex-col">
							<span className="font-semibold text-13">{user.first_name} {user.last_name}</span>
							<span className="text-11 text-text-secondary">{user.email}</span>
						</div>
					);
				}
			},
			{
				accessorKey: 'type',
				header: 'Type',
				size: 120,
				Cell: ({ row }) => {
					const type = row.original.type;
					const colors: Record<string, string> = {
						earned: 'bg-green-100 text-green-700',
						redeemed: 'bg-orange-100 text-orange-700',
						expired: 'bg-red-100 text-red-700',
						adjusted: 'bg-blue-100 text-blue-700',
					};
					return (
						<Chip
							label={type.toUpperCase()}
							className={`text-10 font-bold ${colors[type] || 'bg-gray-100 text-gray-700'}`}
							size="small"
						/>
					);
				}
			},
			{
				accessorKey: 'points',
				header: 'Points',
				size: 140,
				Cell: ({ row }) => {
					const points = row.original.points;
					const isPositive = points > 0;
					return (
						<Typography
							className={`font-bold text-15 ${isPositive ? 'text-green-600' : 'text-red-600'}`}
						>
							{isPositive ? '+' : ''}{points.toLocaleString()}
						</Typography>
					);
				}
			},
			{
				accessorKey: 'balance_after',
				header: 'New Balance',
				size: 120,
				Cell: ({ row }) => <span className="font-medium">{row.original.balance_after.toLocaleString()}</span>
			},
			{
				accessorKey: 'description',
				header: 'Description',
				Cell: ({ row }) => <span className="text-12 text-text-secondary leading-tight italic">{row.original.description}</span>
			},
			{
				accessorKey: 'order.order_number',
				header: 'Order',
				size: 120,
				Cell: ({ row }) => {
					const order = row.original.order;
					if (!order) return <span className="text-gray-400">—</span>;
					return <span className="font-mono text-12 font-bold text-primary">#{order.order_number || order.id}</span>;
				}
			},
			{
				accessorKey: 'expires_at',
				header: 'Expires At',
				size: 130,
				Cell: ({ row }) => row.original.expires_at ? formatDate(row.original.expires_at) : <span className="text-gray-400">Never</span>
			},
			{
				accessorKey: 'created_at',
				header: 'Date',
				size: 150,
				Cell: ({ row }) => formatDate(row.original.created_at)
			}
		],
		[]
	);

	if (error) return (
		<Paper className="p-24 flex flex-col items-center justify-center shadow-1 rounded-lg">
			<Typography color="error" variant="body1" className="font-semibold text-20">Failed to load loyalty points</Typography>
			<Typography color="text.secondary" variant="body2">Please check your connection or try again later.</Typography>
		</Paper>
	);


	return (
		<div className="flex flex-col space-y-4">
			{/* Current Settings Display - Always Visible */}
			<Card
				elevation={0}
				sx={{
					mb: 3,
					background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
					border: '1px solid',
					borderColor: 'divider',
					borderRadius: 3,
					overflow: 'hidden',
					position: 'relative',
					'&::before': {
						content: '""',
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						height: 4,
						background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
					}
				}}
			>
				<CardContent sx={{ p: 3, '&:last-child': { pb: '296px' } }}>
					<Box
						display="flex"
						justifyContent="space-between"
						alignItems="flex-start"
						flexWrap="wrap"
						gap={2}
					>
						<Box flex={1}>
							<Box
								display="flex"
								alignItems="center"
								gap={1.5}
								mb={2.5}
							>
								<Box
									sx={{
										width: 40,
										height: 40,
										borderRadius: 1.5,
										background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center'
									}}
								>
									<FuseSvgIcon
										className="text-white"
										size={20}
									>
										heroicons-outline:cog-6-tooth
									</FuseSvgIcon>
								</Box>
								<Typography
									variant="h6"
									fontWeight="bold"
									sx={{
										background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
										WebkitBackgroundClip: 'text',
										WebkitTextFillColor: 'transparent'
									}}
								>
									Current Loyalty Points Configuration
								</Typography>
							</Box>
							{isLoadingSettings ? (
								<Grid
									container
									spacing={3}
								>
									{[...Array(5)].map((_, index) => (
										<Grid
											item
											xs={12}
											sm={6}
											md={2.4}
											key={index}
										>
											<Box
												sx={{
													p: 2,
													bgcolor: 'background.paper',
													borderRadius: 2,
													border: '1px solid',
													borderColor: 'divider'
												}}
											>
												<Typography
													variant="caption"
													color="text.secondary"
													gutterBottom
													display="block"
												>
													Loading...
												</Typography>
												<Box
													mt={1}
													sx={{ height: 24, bgcolor: 'grey.200', borderRadius: 1 }}
												/>
											</Box>
										</Grid>
									))}
								</Grid>
							) : (
								<Grid
									container
									spacing={3}
								>
									<Grid
										item
										xs={12}
										sm={6}
										md={2.4}
									>
										<Box
											sx={{
												p: 2,
												bgcolor: 'background.paper',
												borderRadius: 2,
												border: '1px solid',
												borderColor: 'divider'
											}}
										>
											<Typography
												variant="caption"
												color="text.secondary"
												gutterBottom
												display="block"
											>
												Status
											</Typography>
											<Box mt={1}>
												{displaySettings.loyalty_points_enabled ? (
													<Chip
														label="Enabled"
														color="success"
														size="small"
														sx={{ fontWeight: 600 }}
													/>
												) : (
													<Chip
														label="Disabled"
														color="default"
														size="small"
														sx={{ fontWeight: 600 }}
													/>
												)}
											</Box>
										</Box>
									</Grid>
									{displaySettings.loyalty_points_enabled ? (
										<>
											<Grid
												item
												xs={12}
												sm={6}
												md={2.4}
											>
												<Box
													sx={{
														p: 2,
														bgcolor: 'background.paper',
														borderRadius: 2,
														border: '1px solid',
														borderColor: 'divider'
													}}
												>
													<Typography
														variant="caption"
														color="text.secondary"
														gutterBottom
														display="block"
													>
														Points Per {displaySettings.default_currency || defaultCurrency}
													</Typography>
													<Typography
														variant="h6"
														fontWeight="700"
														color="primary.main"
														mt={0.5}
													>
														{displaySettings.loyalty_points_per_dollar} point
														{displaySettings.loyalty_points_per_dollar !== 1 ? 's' : ''}
													</Typography>
												</Box>
											</Grid>
											<Grid
												item
												xs={12}
												sm={6}
												md={2.4}
											>
												<Box
													sx={{
														p: 2,
														bgcolor: 'background.paper',
														borderRadius: 2,
														border: '1px solid',
														borderColor: 'divider'
													}}
												>
													<Typography
														variant="caption"
														color="text.secondary"
														gutterBottom
														display="block"
													>
														Redemption Rate
													</Typography>
													<Typography
														variant="h6"
														fontWeight="700"
														color="primary.main"
														mt={0.5}
													>
														{displaySettings.currency_symbol || currencySymbol}
														{displaySettings.loyalty_points_dollar_per_point.toFixed(3)}
													</Typography>
												</Box>
											</Grid>
											<Grid
												item
												xs={12}
												sm={6}
												md={2.4}
											>
												<Box
													sx={{
														p: 2,
														bgcolor: 'background.paper',
														borderRadius: 2,
														border: '1px solid',
														borderColor: 'divider'
													}}
												>
													<Typography
														variant="caption"
														color="text.secondary"
														gutterBottom
														display="block"
													>
														Min Redemption
													</Typography>
													<Typography
														variant="h6"
														fontWeight="700"
														color="primary.main"
														mt={0.5}
													>
														{displaySettings.loyalty_points_min_redemption} pts
													</Typography>
												</Box>
											</Grid>
											<Grid
												item
												xs={12}
												sm={6}
												md={2.4}
											>
												<Box
													sx={{
														p: 2,
														bgcolor: 'background.paper',
														borderRadius: 2,
														border: '1px solid',
														borderColor: 'divider'
													}}
												>
													<Typography
														variant="caption"
														color="text.secondary"
														gutterBottom
														display="block"
													>
														Expiration
													</Typography>
													<Typography
														variant="h6"
														fontWeight="700"
														color="primary.main"
														mt={0.5}
													>
														{displaySettings.loyalty_points_expiration_days
															? `${displaySettings.loyalty_points_expiration_days} days`
															: 'Never'}
													</Typography>
												</Box>
											</Grid>
										</>
									) : (
										<Grid
											item
											xs={12}
										>
											<Alert
												severity="info"
												sx={{ mt: 1 }}
											>
												Loyalty points system is currently disabled. Enable it in settings to
												configure earning and redemption rates.
											</Alert>
										</Grid>
									)}
								</Grid>
							)}
						</Box>
						<Button
							variant="contained"
							color="primary"
							onClick={() => onSettingsDialogOpen?.()}
							startIcon={<FuseSvgIcon>heroicons-outline:pencil</FuseSvgIcon>}
							size="medium"
							sx={{
								borderRadius: 2,
								px: 3,
								fontWeight: 600,
								boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.39)',
								'&:hover': {
									boxShadow: '0 6px 20px 0 rgba(102, 126, 234, 0.5)',
									transform: 'translateY(-2px)',
									transition: 'all 0.3s ease'
								}
							}}
						>
							Edit Settings
						</Button>
					</Box>
				</CardContent>
			</Card>

			{/* Statistics Cards */}
			<Grid
				container
				spacing={3}
				sx={{ mb: 3 }}
			>
				<Grid
					item
					xs={12}
					sm={6}
					md={3}
				>
					<Card
						elevation={0}
						sx={{
							background:
								'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(56, 142, 60, 0.1) 100%)',
							border: '1px solid',
							borderColor: 'success.light',
							borderRadius: 3,
							position: 'relative',
							overflow: 'hidden',
							'&:hover': {
								transform: 'translateY(-4px)',
								boxShadow: '0 8px 24px rgba(76, 175, 80, 0.2)',
								transition: 'all 0.3s ease'
							}
						}}
					>
						<Box
							sx={{
								position: 'absolute',
								top: -20,
								right: -20,
								width: 100,
								height: 100,
								borderRadius: '50%',
								background:
									'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(56, 142, 60, 0.1) 100%)',
								opacity: 0.5
							}}
						/>
						<CardContent sx={{ position: 'relative', p: 3 }}>
							<Box
								display="flex"
								alignItems="center"
								justifyContent="space-between"
								mb={1}
							>
								<Typography
									variant="caption"
									color="text.secondary"
									fontWeight={600}
									textTransform="uppercase"
									letterSpacing={1}
								>
									Total Earned
								</Typography>
								<Box
									sx={{
										width: 40,
										height: 40,
										borderRadius: 2,
										background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center'
									}}
								>
									<FuseSvgIcon
										className="text-white"
										size={20}
									>
										heroicons-outline:arrow-trending-up
									</FuseSvgIcon>
								</Box>
							</Box>
							<Typography
								variant="h3"
								fontWeight="bold"
								color="success.main"
							>
								{stats.total_earned.toLocaleString()}
							</Typography>
							<Typography
								variant="caption"
								color="text.secondary"
								mt={0.5}
							>
								Points earned by users
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid
					item
					xs={12}
					sm={6}
					md={3}
				>
					<Card
						elevation={0}
						sx={{
							background:
								'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(245, 124, 0, 0.1) 100%)',
							border: '1px solid',
							borderColor: 'warning.light',
							borderRadius: 3,
							position: 'relative',
							overflow: 'hidden',
							'&:hover': {
								transform: 'translateY(-4px)',
								boxShadow: '0 8px 24px rgba(255, 152, 0, 0.2)',
								transition: 'all 0.3s ease'
							}
						}}
					>
						<Box
							sx={{
								position: 'absolute',
								top: -20,
								right: -20,
								width: 100,
								height: 100,
								borderRadius: '50%',
								background:
									'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(245, 124, 0, 0.1) 100%)',
								opacity: 0.5
							}}
						/>
						<CardContent sx={{ position: 'relative', p: 3 }}>
							<Box
								display="flex"
								alignItems="center"
								justifyContent="space-between"
								mb={1}
							>
								<Typography
									variant="caption"
									color="text.secondary"
									fontWeight={600}
									textTransform="uppercase"
									letterSpacing={1}
								>
									Total Redeemed
								</Typography>
								<Box
									sx={{
										width: 40,
										height: 40,
										borderRadius: 2,
										background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center'
									}}
								>
									<FuseSvgIcon
										className="text-white"
										size={20}
									>
										heroicons-outline:shopping-cart
									</FuseSvgIcon>
								</Box>
							</Box>
							<Typography
								variant="h3"
								fontWeight="bold"
								color="warning.main"
							>
								{stats.total_redeemed.toLocaleString()}
							</Typography>
							<Typography
								variant="caption"
								color="text.secondary"
								mt={0.5}
							>
								Points redeemed by users
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid
					item
					xs={12}
					sm={6}
					md={3}
				>
					<Card
						elevation={0}
						sx={{
							background:
								'linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(211, 47, 47, 0.1) 100%)',
							border: '1px solid',
							borderColor: 'error.light',
							borderRadius: 3,
							position: 'relative',
							overflow: 'hidden',
							'&:hover': {
								transform: 'translateY(-4px)',
								boxShadow: '0 8px 24px rgba(244, 67, 54, 0.2)',
								transition: 'all 0.3s ease'
							}
						}}
					>
						<Box
							sx={{
								position: 'absolute',
								top: -20,
								right: -20,
								width: 100,
								height: 100,
								borderRadius: '50%',
								background:
									'linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(211, 47, 47, 0.1) 100%)',
								opacity: 0.5
							}}
						/>
						<CardContent sx={{ position: 'relative', p: 3 }}>
							<Box
								display="flex"
								alignItems="center"
								justifyContent="space-between"
								mb={1}
							>
								<Typography
									variant="caption"
									color="text.secondary"
									fontWeight={600}
									textTransform="uppercase"
									letterSpacing={1}
								>
									Total Expired
								</Typography>
								<Box
									sx={{
										width: 40,
										height: 40,
										borderRadius: 2,
										background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center'
									}}
								>
									<FuseSvgIcon
										className="text-white"
										size={20}
									>
										heroicons-outline:clock
									</FuseSvgIcon>
								</Box>
							</Box>
							<Typography
								variant="h3"
								fontWeight="bold"
								color="error.main"
							>
								{stats.total_expired.toLocaleString()}
							</Typography>
							<Typography
								variant="caption"
								color="text.secondary"
								mt={0.5}
							>
								Points expired
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid
					item
					xs={12}
					sm={6}
					md={3}
				>
					<Card
						elevation={0}
						sx={{
							background:
								'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
							border: '1px solid',
							borderColor: 'primary.light',
							borderRadius: 3,
							position: 'relative',
							overflow: 'hidden',
							'&:hover': {
								transform: 'translateY(-4px)',
								boxShadow: '0 8px 24px rgba(102, 126, 234, 0.2)',
								transition: 'all 0.3s ease'
							}
						}}
					>
						<Box
							sx={{
								position: 'absolute',
								top: -20,
								right: -20,
								width: 100,
								height: 100,
								borderRadius: '50%',
								background:
									'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
								opacity: 0.5
							}}
						/>
						<CardContent sx={{ position: 'relative', p: 3 }}>
							<Box
								display="flex"
								alignItems="center"
								justifyContent="space-between"
								mb={1}
							>
								<Typography
									variant="caption"
									color="text.secondary"
									fontWeight={600}
									textTransform="uppercase"
									letterSpacing={1}
								>
									Current Balance
								</Typography>
								<Box
									sx={{
										width: 40,
										height: 40,
										borderRadius: 2,
										background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center'
									}}
								>
									<FuseSvgIcon
										className="text-white"
										size={20}
									>
										heroicons-outline:wallet
									</FuseSvgIcon>
								</Box>
							</Box>
							<Typography
								variant="h3"
								fontWeight="bold"
								color="primary.main"
							>
								{stats.current_balance.toLocaleString()}
							</Typography>
							<Typography
								variant="caption"
								color="text.secondary"
								mt={0.5}
							>
								Active points balance
							</Typography>
						</CardContent>
					</Card>
				</Grid>
			</Grid>

			{/* Filters */}
			<Paper
				elevation={0}
				sx={{
					p: 3,
					mb: 3,
					borderRadius: 3,
					border: '1px solid',
					borderColor: 'divider',
					background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)'
				}}
			>
				<Box
					display="flex"
					alignItems="center"
					gap={1.5}
					mb={2.5}
				>
					<FuseSvgIcon
						className="text-primary"
						size={24}
					>
						heroicons-outline:funnel
					</FuseSvgIcon>
					<Typography
						variant="h6"
						fontWeight="bold"
					>
						Filters
					</Typography>
				</Box>
				<Grid
					container
					spacing={2}
				>
					<Grid
						item
						xs={12}
						sm={6}
						md={3}
					>
						<TextField
							fullWidth
							label="Type"
							select
							value={filters.type}
							onChange={(e) => setFilters({ ...filters, type: e.target.value })}
							size="small"
						>
							<MenuItem value="">All Types</MenuItem>
							<MenuItem value="earned">Earned</MenuItem>
							<MenuItem value="redeemed">Redeemed</MenuItem>
							<MenuItem value="expired">Expired</MenuItem>
							<MenuItem value="adjusted">Adjusted</MenuItem>
						</TextField>
					</Grid>
					<Grid
						item
						xs={12}
						sm={6}
						md={3}
					>
						<TextField
							fullWidth
							label="Date From"
							type="date"
							value={filters.date_from}
							onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
							size="small"
							InputLabelProps={{ shrink: true }}
						/>
					</Grid>
					<Grid
						item
						xs={12}
						sm={6}
						md={3}
					>
						<TextField
							fullWidth
							label="Date To"
							type="date"
							value={filters.date_to}
							onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
							size="small"
							InputLabelProps={{ shrink: true }}
						/>
					</Grid>
					<Grid
						item
						xs={12}
						sm={6}
						md={3}
					>
						<Button
							variant="outlined"
							onClick={() => setFilters({ user_id: '', type: '', date_from: '', date_to: '' })}
							sx={{ mt: 1 }}
						>
							Reset
						</Button>
					</Grid>
				</Grid>
			</Paper>

			<Paper className="flex flex-col flex-auto shadow hover:shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden border-1 border-divider" elevation={0}>
				<DataTable
					data={loyaltyPoints}
					columns={columns}
					state={{ isLoading }}
					enableRowSelection={false}
					enableRowActions={true}
					renderRowActionMenuItems={({ closeMenu, row }) => [
						<MenuItem
							key="adjust"
							onClick={() => {
								const user = row.original.user;
								if (user) {
									setSelectedUser({
										id: user.id,
										name: `${user.first_name} ${user.last_name}`,
										email: user.email,
										balance: row.original.balance_after
									});
									setAdjustDialogOpen(true);
								}
								closeMenu();
							}}
						>
							<ListItemIcon>
								<FuseSvgIcon>heroicons-outline:adjustments-horizontal</FuseSvgIcon>
							</ListItemIcon>
							Adjust Points
						</MenuItem>,
						<MenuItem
							key="view-history"
							onClick={() => {
								window.location.href = `/apps/e-commerce/loyalty-points/user/${row.original.user_id}/history`;
								closeMenu();
							}}
						>
							<ListItemIcon>
								<FuseSvgIcon>heroicons-outline:eye</FuseSvgIcon>
							</ListItemIcon>
							View User History
						</MenuItem>
					]}
				/>
			</Paper>

			{/* Adjust Points Dialog */}
			<Dialog 
				open={adjustDialogOpen} 
				onClose={() => setAdjustDialogOpen(false)}
				maxWidth="xs"
				fullWidth
			>
				<DialogTitle className="border-b-1 pb-16">Adjust User Points</DialogTitle>
				<DialogContent className="pt-24">
					{selectedUser && (
						<div className="space-y-16">
							<div className="bg-blue-50 p-16 rounded-lg space-y-4">
								<Typography variant="body2" className="flex justify-between">
									<span className="text-blue-600">User:</span>
									<span className="font-bold text-blue-800">{selectedUser.name}</span>
								</Typography>
								<Typography variant="body2" className="flex justify-between">
									<span className="text-blue-600">Current Balance:</span>
									<span className="font-bold text-blue-800">{selectedUser.balance.toLocaleString()} pts</span>
								</Typography>
							</div>
							
							<TextField
								fullWidth
								label="Points to Add/Subtract"
								type="number"
								value={adjustPoints}
								onChange={(e) => setAdjustPoints(e.target.value)}
								helperText="Use negative numbers to subtract points (e.g. -100)"
								variant="outlined"
								autoFocus
							/>
							
							<TextField
								fullWidth
								label="Description / Reason"
								multiline
								rows={2}
								value={adjustDescription}
								onChange={(e) => setAdjustDescription(e.target.value)}
								placeholder="e.g. Manual correction, Promotion bonus..."
								required
							/>
						</div>
					)}
				</DialogContent>
				<DialogActions className="p-16 border-t-1">
					<Button onClick={() => setAdjustDialogOpen(false)}>Cancel</Button>
					<Button 
						onClick={handleAdjustPoints} 
						variant="contained" 
						color="primary"
						disabled={!adjustPoints || !adjustDescription.trim()}
						className="px-24"
					>
						Adjust Points
					</Button>
				</DialogActions>
			</Dialog>

			{/* Settings Dialog */}
			<LoyaltyPointsSettingsDialog
				open={settingsDialogOpen}
				onClose={() => onSettingsDialogClose?.()}
				currentSettings={displaySettings as any}
			/>
		</div>
	);
}

export default LoyaltyPointsTable;

