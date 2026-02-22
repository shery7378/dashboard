'use client';

import { useState, useEffect } from 'react';
import {
	Box,
	Card,
	CardContent,
	Typography,
	Button,
	Grid,
	Chip,
	CircularProgress,
	Alert,
	IconButton,
	Stack
} from '@mui/material';
import { motion } from 'motion/react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import LiveSellingHeader from './LiveSellingHeader';
import LiveSellingSessionDialog from './LiveSellingSessionDialog';

interface LiveSellingSession {
	id: number;
	title: string;
	description?: string;
	status: 'scheduled' | 'live' | 'ended' | 'cancelled';
	scheduled_at?: string;
	started_at?: string;
	ended_at?: string;
	viewer_count: number;
	featured_products?: number[];
	thumbnail?: string;
	channel_name: string;
	vendor?: {
		id: number;
		first_name?: string;
		last_name?: string;
		email: string;
	};
	store?: {
		id: number;
		name: string;
	};
}

function LiveSelling() {
	const { enqueueSnackbar } = useSnackbar();
	const [sessions, setSessions] = useState<LiveSellingSession[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedSession, setSelectedSession] = useState<LiveSellingSession | null>(null);
	const [actionLoading, setActionLoading] = useState<number | null>(null);

	const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

	useEffect(() => {
		fetchSessions();
	}, []);

	const fetchSessions = async () => {
		try {
			setLoading(true);
			setError(null);
			const token =
				localStorage.getItem('accessToken') ||
				localStorage.getItem('token') ||
				localStorage.getItem('auth_token');
			const response = await axios.get(`${apiUrl}/api/live-selling/my-sessions`, {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: 'application/json'
				}
			});
			const data = response.data.data?.data || response.data.data || [];
			setSessions(Array.isArray(data) ? data : []);
		} catch (err: any) {
			console.error('Error fetching sessions:', err);
			setError(err.response?.data?.message || 'Failed to load live selling sessions');
			enqueueSnackbar('Failed to load sessions', { variant: 'error' });
		} finally {
			setLoading(false);
		}
	};

	const handleCreateSession = () => {
		setSelectedSession(null);
		setDialogOpen(true);
	};

	const handleEditSession = (session: LiveSellingSession) => {
		setSelectedSession(session);
		setDialogOpen(true);
	};

	const handleDeleteSession = async (sessionId: number) => {
		if (!window.confirm('Are you sure you want to delete this session?')) {
			return;
		}

		try {
			setActionLoading(sessionId);
			const token =
				localStorage.getItem('accessToken') ||
				localStorage.getItem('token') ||
				localStorage.getItem('auth_token');
			await axios.delete(`${apiUrl}/api/live-selling/${sessionId}`, {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: 'application/json'
				}
			});
			enqueueSnackbar('Session deleted successfully', { variant: 'success' });
			fetchSessions();
		} catch (err: any) {
			console.error('Error deleting session:', err);
			enqueueSnackbar(err.response?.data?.message || 'Failed to delete session', { variant: 'error' });
		} finally {
			setActionLoading(null);
		}
	};

	const handleStartSession = async (sessionId: number) => {
		try {
			setActionLoading(sessionId);
			const token =
				localStorage.getItem('accessToken') ||
				localStorage.getItem('token') ||
				localStorage.getItem('auth_token');
			const response = await axios.post(
				`${apiUrl}/api/live-selling/${sessionId}/start`,
				{},
				{
					headers: {
						Authorization: `Bearer ${token}`,
						Accept: 'application/json'
					}
				}
			);
			enqueueSnackbar('Session started successfully', { variant: 'success' });
			fetchSessions();

			// Open the live session in a new window (frontend URL)
			const frontendUrl =
				process.env.NEXT_PUBLIC_FRONTEND_URL ||
				window.location.origin.replace(':3000', ':3001') ||
				'http://localhost:3001';
			const sessionUrl = `${frontendUrl}/live-selling/${sessionId}`;
			window.open(sessionUrl, '_blank');
		} catch (err: any) {
			console.error('Error starting session:', err);
			enqueueSnackbar(err.response?.data?.message || 'Failed to start session', { variant: 'error' });
		} finally {
			setActionLoading(null);
		}
	};

	const handleEndSession = async (sessionId: number) => {
		if (!window.confirm('Are you sure you want to end this live session?')) {
			return;
		}

		try {
			setActionLoading(sessionId);
			const token =
				localStorage.getItem('accessToken') ||
				localStorage.getItem('token') ||
				localStorage.getItem('auth_token');
			await axios.post(
				`${apiUrl}/api/live-selling/${sessionId}/end`,
				{},
				{
					headers: {
						Authorization: `Bearer ${token}`,
						Accept: 'application/json'
					}
				}
			);
			enqueueSnackbar('Session ended successfully', { variant: 'success' });
			fetchSessions();
		} catch (err: any) {
			console.error('Error ending session:', err);
			enqueueSnackbar(err.response?.data?.message || 'Failed to end session', { variant: 'error' });
		} finally {
			setActionLoading(null);
		}
	};

	const handleDialogClose = (refresh = false) => {
		setDialogOpen(false);
		setSelectedSession(null);

		if (refresh) {
			fetchSessions();
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'live':
				return 'error';
			case 'scheduled':
				return 'info';
			case 'ended':
				return 'default';
			case 'cancelled':
				return 'warning';
			default:
				return 'default';
		}
	};

	const formatDate = (dateString?: string) => {
		if (!dateString) return 'N/A';

		return new Date(dateString).toLocaleString();
	};

	if (loading) {
		return (
			<Box className="flex items-center justify-center min-h-screen">
				<CircularProgress />
			</Box>
		);
	}

	return (
		<div className="flex flex-col flex-auto p-24 sm:p-32">
			<LiveSellingHeader onCreateSession={handleCreateSession} />

			{error && (
				<Alert
					severity="error"
					className="mb-24"
					onClose={() => setError(null)}
				>
					{error}
				</Alert>
			)}

			{sessions.length === 0 ? (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
				>
					<Card
						sx={{
							borderRadius: 4,
							overflow: 'hidden',
							boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
							background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)'
						}}
					>
						<CardContent
							sx={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								py: { xs: 8, sm: 12 },
								px: { xs: 4, sm: 6 },
								position: 'relative',
								overflow: 'hidden'
							}}
						>
							{/* Decorative background circles */}
							<Box
								sx={{
									position: 'absolute',
									top: -100,
									right: -100,
									width: 300,
									height: 300,
									borderRadius: '50%',
									background:
										'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
									filter: 'blur(80px)'
								}}
							/>
							<Box
								sx={{
									position: 'absolute',
									bottom: -80,
									left: -80,
									width: 250,
									height: 250,
									borderRadius: '50%',
									background:
										'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
									filter: 'blur(60px)'
								}}
							/>

							{/* Main content */}
							<Box
								sx={{
									position: 'relative',
									zIndex: 1,
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									maxWidth: 500,
									textAlign: 'center'
								}}
							>
								{/* Icon container with gradient background */}
								<Box
									sx={{
										width: { xs: 120, sm: 140 },
										height: { xs: 120, sm: 140 },
										borderRadius: '50%',
										background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										mb: 4,
										boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
										position: 'relative'
									}}
								>
									<FuseSvgIcon
										sx={{
											fontSize: { xs: 56, sm: 64 },
											color: 'white'
										}}
									>
										heroicons-outline:video-camera
									</FuseSvgIcon>
									{/* Animated pulse effect */}
									<Box
										sx={{
											position: 'absolute',
											width: '100%',
											height: '100%',
											borderRadius: '50%',
											border: '3px solid rgba(255, 255, 255, 0.3)',
											animation: 'pulse 2s infinite',
											'@keyframes pulse': {
												'0%': {
													transform: 'scale(1)',
													opacity: 1
												},
												'100%': {
													transform: 'scale(1.2)',
													opacity: 0
												}
											}
										}}
									/>
								</Box>

								<Typography
									variant="h4"
									sx={{
										fontWeight: 700,
										mb: 2,
										color: 'text.primary',
										fontSize: { xs: '1.75rem', sm: '2rem' }
									}}
								>
									No Live Selling Sessions
								</Typography>
								<Typography
									variant="body1"
									sx={{
										color: 'text.secondary',
										mb: 5,
										fontSize: { xs: '1rem', sm: '1.1rem' },
										lineHeight: 1.7,
										maxWidth: 400
									}}
								>
									Create your first live selling session to start broadcasting to customers and
									showcase your products in real-time
								</Typography>

								<motion.div
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
								>
									<Button
										variant="contained"
										size="large"
										startIcon={
											<FuseSvgIcon sx={{ fontSize: 20 }}>heroicons-solid:plus</FuseSvgIcon>
										}
										onClick={handleCreateSession}
										sx={{
											background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
											color: 'white',
											fontWeight: 700,
											fontSize: '1rem',
											padding: '14px 40px',
											borderRadius: 2,
											textTransform: 'none',
											boxShadow: '0 6px 25px rgba(102, 126, 234, 0.4)',
											'&:hover': {
												background: 'linear-gradient(135deg, #5568d3 0%, #6a3d91 100%)',
												boxShadow: '0 8px 30px rgba(102, 126, 234, 0.5)'
											}
										}}
									>
										Create Your First Session
									</Button>
								</motion.div>
							</Box>
						</CardContent>
					</Card>
				</motion.div>
			) : (
				<Grid
					container
					spacing={3}
				>
					{sessions.map((session, index) => (
						<Grid
							item
							xs={12}
							sm={6}
							md={4}
							key={session.id}
						>
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3, delay: index * 0.1 }}
								whileHover={{ y: -8 }}
							>
								<Card
									sx={{
										display: 'flex',
										flexDirection: 'column',
										height: '100%',
										borderRadius: 3,
										overflow: 'hidden',
										boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
										transition: 'all 0.3s ease',
										'&:hover': {
											boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
										}
									}}
								>
									<Box
										sx={{
											position: 'relative',
											height: 200,
											background: session.thumbnail
												? `url(${session.thumbnail})`
												: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
											backgroundSize: 'cover',
											backgroundPosition: 'center',
											'&::before': {
												content: '""',
												position: 'absolute',
												top: 0,
												left: 0,
												right: 0,
												bottom: 0,
												background: session.thumbnail
													? 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)'
													: 'transparent'
											}
										}}
									>
										{!session.thumbnail && (
											<Box
												sx={{
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													height: '100%'
												}}
											>
												<FuseSvgIcon
													sx={{
														fontSize: 64,
														color: 'white',
														opacity: 0.6
													}}
												>
													heroicons-outline:video-camera
												</FuseSvgIcon>
											</Box>
										)}
										<Chip
											label={session.status.toUpperCase()}
											color={getStatusColor(session.status)}
											size="small"
											sx={{
												position: 'absolute',
												top: 12,
												right: 12,
												fontWeight: 700,
												fontSize: '0.7rem'
											}}
										/>
										{session.status === 'live' && (
											<Chip
												icon={
													<FuseSvgIcon sx={{ fontSize: 16, color: 'white !important' }}>
														heroicons-solid:eye
													</FuseSvgIcon>
												}
												label={`${session.viewer_count} viewers`}
												sx={{
													position: 'absolute',
													top: 12,
													left: 12,
													background: 'rgba(244, 67, 54, 0.9)',
													color: 'white',
													fontWeight: 600,
													fontSize: '0.75rem',
													'& .MuiChip-icon': {
														color: 'white'
													}
												}}
											/>
										)}
									</Box>
									<CardContent
										sx={{
											display: 'flex',
											flexDirection: 'column',
											flex: 1,
											p: 3
										}}
									>
										<Typography
											variant="h6"
											sx={{
												mb: 1.5,
												fontWeight: 700,
												fontSize: '1.25rem',
												lineHeight: 1.3,
												display: '-webkit-box',
												WebkitLineClamp: 2,
												WebkitBoxOrient: 'vertical',
												overflow: 'hidden'
											}}
										>
											{session.title}
										</Typography>
										{session.description && (
											<Typography
												variant="body2"
												sx={{
													color: 'text.secondary',
													mb: 2,
													display: '-webkit-box',
													WebkitLineClamp: 2,
													WebkitBoxOrient: 'vertical',
													overflow: 'hidden',
													lineHeight: 1.6
												}}
											>
												{session.description}
											</Typography>
										)}
										<Stack
											spacing={0.5}
											sx={{ mb: 2.5, flex: 1 }}
										>
											{session.scheduled_at && (
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
													<FuseSvgIcon sx={{ fontSize: 16, color: 'text.secondary' }}>
														heroicons-outline:calendar
													</FuseSvgIcon>
													<Typography
														variant="caption"
														sx={{ color: 'text.secondary', fontSize: '0.8rem' }}
													>
														{formatDate(session.scheduled_at)}
													</Typography>
												</Box>
											)}
											{session.started_at && (
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
													<FuseSvgIcon sx={{ fontSize: 16, color: 'text.secondary' }}>
														heroicons-outline:clock
													</FuseSvgIcon>
													<Typography
														variant="caption"
														sx={{ color: 'text.secondary', fontSize: '0.8rem' }}
													>
														Started: {formatDate(session.started_at)}
													</Typography>
												</Box>
											)}
											{session.ended_at && (
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
													<FuseSvgIcon sx={{ fontSize: 16, color: 'text.secondary' }}>
														heroicons-outline:check-circle
													</FuseSvgIcon>
													<Typography
														variant="caption"
														sx={{ color: 'text.secondary', fontSize: '0.8rem' }}
													>
														Ended: {formatDate(session.ended_at)}
													</Typography>
												</Box>
											)}
										</Stack>
										<Stack
											direction="row"
											spacing={1.5}
											sx={{ mt: 'auto' }}
										>
											{session.status === 'scheduled' && (
												<Button
													variant="contained"
													size="medium"
													fullWidth
													onClick={() => handleStartSession(session.id)}
													disabled={actionLoading === session.id}
													startIcon={
														actionLoading === session.id ? (
															<CircularProgress size={16} />
														) : (
															<FuseSvgIcon>heroicons-solid:play</FuseSvgIcon>
														)
													}
													sx={{
														background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
														fontWeight: 600,
														textTransform: 'none',
														borderRadius: 2,
														'&:hover': {
															background:
																'linear-gradient(135deg, #5568d3 0%, #6a3d91 100%)'
														}
													}}
												>
													Start
												</Button>
											)}
											{session.status === 'live' && (
												<Button
													variant="contained"
													size="medium"
													fullWidth
													onClick={() => handleEndSession(session.id)}
													disabled={actionLoading === session.id}
													startIcon={
														actionLoading === session.id ? (
															<CircularProgress size={16} />
														) : (
															<FuseSvgIcon>heroicons-solid:stop</FuseSvgIcon>
														)
													}
													sx={{
														background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
														fontWeight: 600,
														textTransform: 'none',
														borderRadius: 2,
														'&:hover': {
															background:
																'linear-gradient(135deg, #e53935 0%, #c62828 100%)'
														}
													}}
												>
													End
												</Button>
											)}
											<IconButton
												size="medium"
												onClick={() => handleEditSession(session)}
												disabled={session.status === 'live' || session.status === 'ended'}
												sx={{
													border: '1px solid',
													borderColor: 'divider',
													'&:hover': {
														background: 'action.hover'
													}
												}}
											>
												<FuseSvgIcon>heroicons-outline:pencil</FuseSvgIcon>
											</IconButton>
											<IconButton
												size="medium"
												color="error"
												onClick={() => handleDeleteSession(session.id)}
												disabled={actionLoading === session.id || session.status === 'live'}
												sx={{
													border: '1px solid',
													borderColor: 'error.main',
													'&:hover': {
														background: 'error.light',
														color: 'error.dark'
													}
												}}
											>
												<FuseSvgIcon>heroicons-outline:trash</FuseSvgIcon>
											</IconButton>
										</Stack>
									</CardContent>
								</Card>
							</motion.div>
						</Grid>
					))}
				</Grid>
			)}

			<LiveSellingSessionDialog
				open={dialogOpen}
				onClose={handleDialogClose}
				session={selectedSession}
			/>
		</div>
	);
}

export default LiveSelling;
