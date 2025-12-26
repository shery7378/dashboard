'use client';

import { useState, useEffect, useRef } from 'react';
import { 
	Paper, 
	Typography, 
	TextField, 
	Button, 
	Avatar, 
	Box, 
	CircularProgress, 
	Alert,
	Badge,
	Chip,
	InputAdornment,
	Fade,
	Tooltip
} from '@mui/material';
import { IconButton } from '@mui/material';
import Icon from '@mui/material/Icon';
import { getSession } from 'next-auth/react';
import { alpha, useTheme } from '@mui/material/styles';

// Get API URL from environment or use default
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

function MessagesAppContent() {
	const [isInitialized, setIsInitialized] = useState(false);
	const [initError, setInitError] = useState<string | null>(null);
	const [conversations, setConversations] = useState<any[]>([]);
	const [activeConversation, setActiveConversation] = useState<any>(null);
	const [messages, setMessages] = useState<any[]>([]);
	const [messageText, setMessageText] = useState('');
	const [loading, setLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Get auth token - same method as apiServiceLaravel
	const getAuthToken = async () => {
		try {
			const session = await getSession();
			// Try multiple sources for the token (same as apiServiceLaravel)
			const token = 
				session?.accessAuthToken || 
				session?.accessToken || 
				(typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('auth_token') : null);
			
			if (!token) {
				console.log('No token found. Session:', session ? Object.keys(session) : 'null');
				console.log('localStorage token:', typeof window !== 'undefined' ? localStorage.getItem('token') : 'N/A');
				console.log('localStorage auth_token:', typeof window !== 'undefined' ? localStorage.getItem('auth_token') : 'N/A');
			}
			
			return token;
		} catch (error) {
			console.error('Error getting session:', error);
			// Fallback to localStorage
			if (typeof window !== 'undefined') {
				return localStorage.getItem('token') || localStorage.getItem('auth_token');
			}
			return null;
		}
	};

	// Initialize chat
	useEffect(() => {
		const initialize = async () => {
			try {
				const token = await getAuthToken();
				console.log('Token found:', !!token);
				
				if (!token) {
					setInitError('Please login to view messages. No authentication token found.');
					return;
				}

				console.log('Initializing chat with API:', `${API_URL}/api/chat/initialize`);

				const response = await fetch(`${API_URL}/api/chat/initialize`, {
					headers: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json',
						'Accept': 'application/json',
					},
					credentials: 'include', // Include cookies for CORS
				});

				console.log('Initialize response status:', response.status);

				if (!response.ok) {
					const errorText = await response.text();
					console.error('Initialize error response:', errorText);
					throw new Error(`Failed to initialize chat: ${response.status} ${response.statusText}`);
				}

				const data = await response.json();
				console.log('Initialize response data:', data);
				
				if (data.success) {
					setIsInitialized(true);
					fetchConversations();
				} else {
					setInitError(data.message || 'Failed to initialize chat');
				}
			} catch (error: any) {
				console.error('Initialization error:', error);
				setInitError(error.message || 'Failed to connect to server. Please check your connection and try again.');
			}
		};

		initialize();
	}, []);

	// Fetch conversations
	const fetchConversations = async () => {
		try {
			const token = await getAuthToken();
			if (!token) return;

			const response = await fetch(`${API_URL}/api/chat/conversations`, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				credentials: 'include',
			});

			if (response.ok) {
				const data = await response.json();
				if (data.success && data.data) {
					setConversations(data.data);
					// Auto-select first conversation if none selected
					if (!activeConversation && data.data.length > 0) {
						setActiveConversation(data.data[0]);
					}
				}
			}
		} catch (error) {
			console.error('Error fetching conversations:', error);
		}
	};

	// Fetch messages for active conversation
	useEffect(() => {
		if (activeConversation && isInitialized) {
			fetchMessages();
		}
	}, [activeConversation, isInitialized]);

	// Poll for new messages
	useEffect(() => {
		if (isInitialized) {
			pollIntervalRef.current = setInterval(() => {
				fetchConversations();
				if (activeConversation) {
					fetchMessages();
				}
			}, 3000); // Poll every 3 seconds
		}

		return () => {
			if (pollIntervalRef.current) {
				clearInterval(pollIntervalRef.current);
			}
		};
	}, [isInitialized, activeConversation]);

	const fetchMessages = async () => {
		if (!activeConversation) return;

		try {
			const token = await getAuthToken();
			if (!token) return;

			const response = await fetch(`${API_URL}/api/chat/conversations/${activeConversation.id}`, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				credentials: 'include',
			});

			if (response.ok) {
				const data = await response.json();
				if (data.success && data.data?.messages) {
					setMessages(data.data.messages);
				}
			}
		} catch (error) {
			console.error('Error fetching messages:', error);
		}
	};

	// Scroll to bottom when messages change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!messageText.trim() || !activeConversation) return;

		setLoading(true);
		try {
			const token = await getAuthToken();
			if (!token) {
				setLoading(false);
				return;
			}

			const response = await fetch(`${API_URL}/api/chat/messages`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					conversation_id: activeConversation.id,
					message: messageText,
					type: 'text',
				}),
			});

			if (response.ok) {
				setMessageText('');
				// Refresh messages
				setTimeout(() => {
					fetchMessages();
					fetchConversations();
				}, 300);
			}
		} catch (error) {
			console.error('Error sending message:', error);
		} finally {
			setLoading(false);
		}
	};

	const theme = useTheme();

	if (initError) {
		return (
			<div className="flex items-center justify-center min-h-[400px] p-24">
				<Alert 
					severity="error" 
					sx={{ 
						borderRadius: 2,
						boxShadow: theme.shadows[3]
					}}
				>
					{initError}
				</Alert>
			</div>
		);
	}

	if (!isInitialized) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[400px] gap-16">
				<CircularProgress size={48} thickness={4} />
				<Typography variant="body2" color="text.secondary" className="mt-8">
					Loading messages...
				</Typography>
			</div>
		);
	}

	return (
		<Box 
			sx={{ 
				display: 'flex',
				height: '100%',
				backgroundColor: theme.palette.background.default,
			}}
		>
			{/* Conversations Sidebar */}
			<Paper 
				elevation={0}
				sx={{
					width: 320,
					display: 'flex',
					flexDirection: 'column',
					borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
					backgroundColor: theme.palette.background.paper,
				}}
			>
				{/* Sidebar Header */}
				<Box 
					sx={{
						p: 3,
						borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
						background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.primary.dark} 100%)`,
						color: theme.palette.primary.contrastText,
						position: 'relative',
						overflow: 'hidden',
						'&::before': {
							content: '""',
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							background: `radial-gradient(circle at 20% 30%, ${alpha(theme.palette.primary.contrastText, 0.1)} 0%, transparent 50%)`,
							pointerEvents: 'none',
						},
					}}
				>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, position: 'relative', zIndex: 1 }}>
						<Box
							sx={{
								width: 40,
								height: 40,
								borderRadius: 2,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								backgroundColor: alpha(theme.palette.primary.contrastText, 0.2),
								backdropFilter: 'blur(10px)',
								boxShadow: `0 4px 12px ${alpha(theme.palette.primary.contrastText, 0.2)}`,
							}}
						>
							<Icon sx={{ fontSize: 24, color: theme.palette.primary.contrastText }}>
								chat_bubble
							</Icon>
						</Box>
						<Box sx={{ flex: 1 }}>
							<Typography 
								variant="h6" 
								sx={{ 
									fontWeight: 700,
									fontSize: '1.1rem',
									letterSpacing: '0.5px',
								}}
							>
								Conversations
							</Typography>
							<Typography 
								variant="caption" 
								sx={{ 
									opacity: 0.9,
									fontSize: '0.7rem',
								}}
							>
								{conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
							</Typography>
						</Box>
						{conversations.length > 0 && (
							<Chip 
								label={conversations.length} 
								size="small"
								sx={{
									backgroundColor: alpha(theme.palette.primary.contrastText, 0.25),
									color: theme.palette.primary.contrastText,
									fontWeight: 700,
									fontSize: '0.75rem',
									height: 24,
									boxShadow: `0 2px 8px ${alpha(theme.palette.primary.contrastText, 0.3)}`,
									animation: 'pulse 2s infinite',
									'@keyframes pulse': {
										'0%, 100%': { transform: 'scale(1)' },
										'50%': { transform: 'scale(1.05)' },
									},
								}}
							/>
						)}
					</Box>
				</Box>

				{/* Conversations List */}
				<Box className="flex-1 overflow-y-auto" sx={{ 
					'&::-webkit-scrollbar': { width: '6px' },
					'&::-webkit-scrollbar-track': { background: 'transparent' },
					'&::-webkit-scrollbar-thumb': { 
						background: alpha(theme.palette.text.secondary, 0.2),
						borderRadius: '3px',
					},
				}}>
					{conversations.length === 0 ? (
						<Box 
							sx={{ 
								p: 4, 
								textAlign: 'center',
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								minHeight: 300,
							}}
						>
							<Box
								sx={{
									width: 120,
									height: 120,
									borderRadius: '50%',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
									mb: 3,
									position: 'relative',
									'&::before': {
										content: '""',
										position: 'absolute',
										inset: -4,
										borderRadius: '50%',
										border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
										animation: 'rotate 20s linear infinite',
										'@keyframes rotate': {
											'0%': { transform: 'rotate(0deg)' },
											'100%': { transform: 'rotate(360deg)' },
										},
									},
								}}
							>
								<Icon sx={{ fontSize: 64, color: theme.palette.primary.main, opacity: 0.4 }}>
									chat_bubble_outline
								</Icon>
							</Box>
							<Typography 
								variant="h6" 
								sx={{ 
									mt: 2,
									fontWeight: 600,
									color: theme.palette.text.primary,
								}}
							>
								No conversations yet
							</Typography>
							<Typography 
								variant="body2" 
								sx={{ 
									mt: 1,
									color: theme.palette.text.secondary,
									maxWidth: 200,
								}}
							>
								Start chatting with your customers to see conversations here
							</Typography>
						</Box>
					) : (
						conversations.map((conv, index) => (
							<Fade in timeout={400} key={conv.id} style={{ transitionDelay: `${index * 80}ms` }}>
								<Box
									onClick={() => setActiveConversation(conv)}
									sx={{
										p: 2.5,
										cursor: 'pointer',
										borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
										transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
										background: activeConversation?.id === conv.id 
											? `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`
											: 'transparent',
										position: 'relative',
										'&::before': {
											content: '""',
											position: 'absolute',
											left: 0,
											top: 0,
											bottom: 0,
											width: activeConversation?.id === conv.id ? 4 : 0,
											background: `linear-gradient(180deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
											borderRadius: '0 4px 4px 0',
											transition: 'width 0.3s ease',
										},
										'&:hover': {
											backgroundColor: activeConversation?.id === conv.id
												? alpha(theme.palette.primary.main, 0.15)
												: alpha(theme.palette.action.hover, 0.08),
											transform: 'translateX(4px)',
											boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.1)}`,
											'&::before': {
												width: 4,
											},
										},
									}}
								>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
										<Badge
											overlap="circular"
											anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
											badgeContent={conv.unread_count > 0 ? (
												<Box
													sx={{
														width: 22,
														height: 22,
														borderRadius: '50%',
														backgroundColor: theme.palette.error.main,
														color: theme.palette.error.contrastText,
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														fontSize: '11px',
														fontWeight: 700,
														boxShadow: `0 3px 10px ${alpha(theme.palette.error.main, 0.5)}`,
														animation: conv.unread_count > 0 ? 'bounce 1s infinite' : 'none',
														'@keyframes bounce': {
															'0%, 100%': { transform: 'translateY(0)' },
															'50%': { transform: 'translateY(-3px)' },
														},
													}}
												>
													{conv.unread_count > 9 ? '9+' : conv.unread_count}
												</Box>
											) : null}
										>
											<Avatar
												sx={{
													width: 52,
													height: 52,
													bgcolor: conv.is_support 
														? `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`
														: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
													boxShadow: `0 4px 12px ${alpha(conv.is_support ? theme.palette.secondary.main : theme.palette.primary.main, 0.4)}`,
													fontSize: '20px',
													fontWeight: 700,
													border: `2px solid ${activeConversation?.id === conv.id ? theme.palette.primary.main : 'transparent'}`,
													transition: 'all 0.3s ease',
												}}
											>
												{conv.is_support ? (
													<Icon sx={{ fontSize: 28 }}>support_agent</Icon>
												) : (
													conv.other_user?.name?.charAt(0)?.toUpperCase() || 'U'
												)}
											</Avatar>
										</Badge>
										<Box sx={{ flex: 1, minWidth: 0 }}>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
												<Typography 
													variant="subtitle2" 
													sx={{
														flex: 1,
														fontWeight: activeConversation?.id === conv.id ? 700 : 600,
														color: activeConversation?.id === conv.id 
															? theme.palette.primary.main 
															: theme.palette.text.primary,
														overflow: 'hidden',
														textOverflow: 'ellipsis',
														whiteSpace: 'nowrap',
														fontSize: '0.95rem',
													}}
												>
													{conv.is_support
														? 'Support Chat'
														: conv.other_user?.name || 'Unknown User'}
												</Typography>
												{conv.last_message_at && (
													<Typography 
														variant="caption" 
														sx={{ 
															color: theme.palette.text.disabled,
															fontSize: '0.7rem',
															fontWeight: 500,
															whiteSpace: 'nowrap',
														}}
													>
														{new Date(conv.last_message_at).toLocaleDateString('en-US', { 
															month: 'short', 
															day: 'numeric' 
														})}
													</Typography>
												)}
											</Box>
											<Typography 
												variant="body2" 
												sx={{
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													whiteSpace: 'nowrap',
													color: conv.unread_count > 0 
														? theme.palette.text.primary 
														: theme.palette.text.secondary,
													fontWeight: conv.unread_count > 0 ? 600 : 400,
													fontSize: '0.85rem',
													mt: 0.5,
												}}
											>
												{conv.last_message || 'No messages'}
											</Typography>
										</Box>
									</Box>
								</Box>
							</Fade>
						))
					)}
				</Box>
			</Paper>

			{/* Chat Area */}
			<Box 
				sx={{ 
					flex: 1,
					display: 'flex',
					flexDirection: 'column',
					backgroundColor: theme.palette.background.default,
				}}
			>
				{activeConversation ? (
					<>
						{/* Chat Header */}
						<Paper 
							elevation={0}
							sx={{
								p: 2.5,
								borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
								background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.03)} 50%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
								backdropFilter: 'blur(10px)',
								position: 'sticky',
								top: 0,
								zIndex: 10,
								boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
							}}
						>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
								<Avatar
									sx={{
										width: 48,
										height: 48,
										background: activeConversation.is_support 
											? `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`
											: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
										boxShadow: `0 4px 12px ${alpha(activeConversation.is_support ? theme.palette.secondary.main : theme.palette.primary.main, 0.4)}`,
										border: `2px solid ${alpha(activeConversation.is_support ? theme.palette.secondary.main : theme.palette.primary.main, 0.2)}`,
									}}
								>
									{activeConversation.is_support ? (
										<Icon sx={{ fontSize: 28 }}>support_agent</Icon>
									) : (
										activeConversation.other_user?.name?.charAt(0)?.toUpperCase() || 'U'
									)}
								</Avatar>
								<Box sx={{ flex: 1 }}>
									<Typography 
										variant="h6" 
										sx={{ 
											fontWeight: 700,
											fontSize: '1.1rem',
											mb: 0.25,
										}}
									>
										{activeConversation.is_support
											? 'Support Chat'
											: activeConversation.other_user?.name || 'Chat'}
									</Typography>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
										<Box
											sx={{
												width: 8,
												height: 8,
												borderRadius: '50%',
												backgroundColor: theme.palette.success.main,
												boxShadow: `0 0 8px ${alpha(theme.palette.success.main, 0.6)}`,
												animation: 'pulse 2s infinite',
												'@keyframes pulse': {
													'0%, 100%': { opacity: 1 },
													'50%': { opacity: 0.5 },
												},
											}}
										/>
										<Typography 
											variant="caption" 
											sx={{ 
												color: theme.palette.text.secondary,
												fontWeight: 500,
											}}
										>
											{activeConversation.is_support 
												? 'We\'re here to help' 
												: 'Online'}
										</Typography>
									</Box>
								</Box>
								<IconButton 
									size="small" 
									sx={{ 
										color: theme.palette.text.secondary,
										'&:hover': {
											backgroundColor: alpha(theme.palette.action.hover, 0.1),
											transform: 'rotate(90deg)',
										},
										transition: 'all 0.3s ease',
									}}
								>
									<Icon>more_vert</Icon>
								</IconButton>
							</Box>
						</Paper>

						{/* Messages */}
						<Box 
							sx={{
								flex: 1,
								overflowY: 'auto',
								p: 3,
								backgroundImage: `
									radial-gradient(circle at 15% 30%, ${alpha(theme.palette.primary.main, 0.06)} 0%, transparent 40%),
									radial-gradient(circle at 85% 70%, ${alpha(theme.palette.secondary.main, 0.06)} 0%, transparent 40%),
									linear-gradient(180deg, transparent 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)
								`,
								position: 'relative',
								'&::before': {
									content: '""',
									position: 'absolute',
									top: 0,
									left: 0,
									right: 0,
									height: 100,
									background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, transparent 100%)`,
									pointerEvents: 'none',
									zIndex: 1,
								},
								'&::-webkit-scrollbar': { 
									width: '10px',
								},
								'&::-webkit-scrollbar-track': { 
									background: alpha(theme.palette.action.hover, 0.05),
									borderRadius: '10px',
									margin: '8px 0',
								},
								'&::-webkit-scrollbar-thumb': { 
									background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.4)} 0%, ${alpha(theme.palette.secondary.main, 0.4)} 100%)`,
									borderRadius: '10px',
									border: `2px solid ${theme.palette.background.default}`,
									'&:hover': {
										background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.6)} 0%, ${alpha(theme.palette.secondary.main, 0.6)} 100%)`,
									},
								},
							}}
						>
							{messages.length === 0 ? (
								<Box 
									sx={{ 
										textAlign: 'center', 
										py: 8,
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
										justifyContent: 'center',
										minHeight: 400,
									}}
								>
									<Box
										sx={{
											width: 140,
											height: 140,
											borderRadius: '50%',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
											mb: 3,
											position: 'relative',
											'&::before': {
												content: '""',
												position: 'absolute',
												inset: -6,
												borderRadius: '50%',
												border: `3px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
												animation: 'rotate 25s linear infinite',
												'@keyframes rotate': {
													'0%': { transform: 'rotate(0deg)' },
													'100%': { transform: 'rotate(360deg)' },
												},
											},
										}}
									>
										<Icon 
											sx={{ 
												fontSize: 80, 
												color: theme.palette.primary.main,
												opacity: 0.3,
											}}
										>
											chat_bubble_outline
										</Icon>
									</Box>
									<Typography 
										variant="h5" 
										sx={{ 
											mt: 2,
											fontWeight: 700,
											background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
											backgroundClip: 'text',
											WebkitBackgroundClip: 'text',
											WebkitTextFillColor: 'transparent',
										}}
									>
										No messages yet
									</Typography>
									<Typography 
										variant="body1" 
										sx={{ 
											mt: 1.5,
											color: theme.palette.text.secondary,
											maxWidth: 300,
										}}
									>
										Start the conversation by sending your first message!
									</Typography>
								</Box>
							) : (
								<Box sx={{ '& > * + *': { mt: 2 } }}>
									{messages.map((msg: any, idx: number) => {
										const userId = parseInt(
											localStorage.getItem('user_id') ||
											localStorage.getItem('id') ||
											'0'
										);
										const isOwn = msg.sender_id === userId;

										return (
											<Fade 
												in 
												timeout={500} 
												key={idx} 
												style={{ transitionDelay: `${Math.min(idx * 100, 1000)}ms` }}
											>
												<Box
													sx={{
														display: 'flex',
														justifyContent: isOwn ? 'flex-end' : 'flex-start',
														alignItems: 'flex-end',
														gap: 1.5,
														mb: 2,
													}}
												>
													{!isOwn && (
														<Avatar
															sx={{
																width: 36,
																height: 36,
																background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
																fontSize: '15px',
																fontWeight: 600,
																boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.main, 0.3)}`,
															}}
														>
															{msg.sender_name?.charAt(0)?.toUpperCase() || 'U'}
														</Avatar>
													)}
													<Box
														sx={{
															maxWidth: '75%',
															px: 2.5,
															py: 1.75,
															borderRadius: 3,
															position: 'relative',
															...(isOwn
																? {
																		background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
																		color: theme.palette.primary.contrastText,
																		borderTopRightRadius: 6,
																		boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
																	}
																: {
																		backgroundColor: theme.palette.background.paper,
																		color: theme.palette.text.primary,
																		borderTopLeftRadius: 6,
																		boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.08)}`,
																		border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
																	}),
															'&::before': !isOwn ? {
																content: '""',
																position: 'absolute',
																left: -8,
																bottom: 0,
																width: 0,
																height: 0,
																borderStyle: 'solid',
																borderWidth: '0 8px 12px 0',
																borderColor: `transparent ${theme.palette.background.paper} transparent transparent`,
															} : {},
															'&::after': isOwn ? {
																content: '""',
																position: 'absolute',
																right: -8,
																bottom: 0,
																width: 0,
																height: 0,
																borderStyle: 'solid',
																borderWidth: '0 0 12px 8px',
																borderColor: `transparent transparent ${theme.palette.primary.main} transparent`,
															} : {},
														}}
													>
														{!isOwn && (
															<Typography 
																variant="caption" 
																sx={{
																	fontWeight: 700,
																	display: 'block',
																	mb: 0.75,
																	color: theme.palette.text.secondary,
																	fontSize: '0.75rem',
																	textTransform: 'uppercase',
																	letterSpacing: '0.5px',
																}}
															>
																{msg.sender_name || 'Support Bot'}
															</Typography>
														)}
														<Typography 
															variant="body1"
															sx={{
																wordBreak: 'break-word',
																lineHeight: 1.6,
																fontSize: '0.95rem',
																fontWeight: isOwn ? 400 : 500,
															}}
														>
															{msg.message}
														</Typography>
														<Box
															sx={{
																display: 'flex',
																justifyContent: 'flex-end',
																alignItems: 'center',
																gap: 0.5,
																mt: 1,
															}}
														>
															<Typography
																variant="caption"
																sx={{
																	fontSize: '0.7rem',
																	color: isOwn 
																		? alpha(theme.palette.primary.contrastText, 0.8)
																		: theme.palette.text.disabled,
																	fontWeight: 500,
																}}
															>
																{new Date(msg.created_at).toLocaleTimeString([], { 
																	hour: '2-digit', 
																	minute: '2-digit' 
																})}
															</Typography>
															{isOwn && (
																<Icon 
																	sx={{ 
																		fontSize: 14,
																		color: alpha(theme.palette.primary.contrastText, 0.7),
																	}}
																>
																	done_all
																</Icon>
															)}
														</Box>
													</Box>
													{isOwn && (
														<Avatar
															sx={{
																width: 36,
																height: 36,
																background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
																fontSize: '12px',
																fontWeight: 600,
																boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
															}}
														>
															You
														</Avatar>
													)}
												</Box>
											</Fade>
										);
									})}
									<div ref={messagesEndRef} />
								</Box>
							)}
						</Box>

						{/* Message Input */}
						<Paper 
							elevation={0}
							sx={{
								p: 2.5,
								borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
								backgroundColor: theme.palette.background.paper,
								background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
								backdropFilter: 'blur(10px)',
								position: 'sticky',
								bottom: 0,
								zIndex: 10,
								boxShadow: `0 -2px 12px ${alpha(theme.palette.common.black, 0.05)}`,
							}}
						>
							<form onSubmit={handleSendMessage}>
								<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
									<Box
										sx={{
											flex: 1,
											position: 'relative',
											'&::before': {
												content: '""',
												position: 'absolute',
												inset: 0,
												borderRadius: 4,
												padding: '2px',
												background: messageText.trim() 
													? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
													: 'transparent',
												WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
												WebkitMaskComposite: 'xor',
												maskComposite: 'exclude',
												opacity: messageText.trim() ? 1 : 0,
												transition: 'opacity 0.3s ease',
											},
										}}
									>
										<TextField
											fullWidth
											value={messageText}
											onChange={(e) => setMessageText(e.target.value)}
											placeholder="Type a message..."
											variant="outlined"
											size="medium"
											disabled={loading}
											multiline
											maxRows={4}
											sx={{
												'& .MuiOutlinedInput-root': {
													borderRadius: 3,
													backgroundColor: theme.palette.background.default,
													transition: 'all 0.3s ease',
													'&:hover': {
														backgroundColor: alpha(theme.palette.action.hover, 0.05),
														boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.1)}`,
													},
													'&.Mui-focused': {
														backgroundColor: theme.palette.background.paper,
														boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`,
														transform: 'translateY(-2px)',
													},
												},
											}}
											InputProps={{
												startAdornment: (
													<InputAdornment position="start">
														<IconButton 
															size="small"
															sx={{ 
																color: theme.palette.text.disabled,
																'&:hover': {
																	color: theme.palette.primary.main,
																	transform: 'scale(1.1) rotate(15deg)',
																},
																transition: 'all 0.2s ease',
															}}
														>
															<Icon>insert_emoticon</Icon>
														</IconButton>
													</InputAdornment>
												),
											}}
										/>
									</Box>
									<Tooltip title="Send message" arrow>
										<span>
											<IconButton
												type="submit"
												disabled={!messageText.trim() || loading}
												sx={{
													width: 56,
													height: 56,
													background: messageText.trim() 
														? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
														: alpha(theme.palette.action.disabled, 0.1),
													color: messageText.trim() 
														? theme.palette.primary.contrastText 
														: theme.palette.action.disabled,
													boxShadow: messageText.trim() 
														? `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`
														: 'none',
													'&:hover': {
														background: messageText.trim() 
															? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
															: alpha(theme.palette.action.disabled, 0.1),
														transform: messageText.trim() ? 'scale(1.1) rotate(5deg)' : 'none',
														boxShadow: messageText.trim() 
															? `0 8px 24px ${alpha(theme.palette.primary.main, 0.5)}`
															: 'none',
													},
													'&:active': {
														transform: messageText.trim() ? 'scale(0.95)' : 'none',
													},
													transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
												}}
											>
												{loading ? (
													<CircularProgress size={24} sx={{ color: 'inherit' }} />
												) : (
													<Icon sx={{ fontSize: 24 }}>send</Icon>
												)}
											</IconButton>
										</span>
									</Tooltip>
								</Box>
							</form>
						</Paper>
					</>
				) : (
					<Box 
						sx={{ 
							flex: 1,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							position: 'relative',
							overflow: 'hidden',
						}}
					>
						<Box
							sx={{
								position: 'absolute',
								inset: 0,
								background: `
									radial-gradient(circle at 30% 40%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 50%),
									radial-gradient(circle at 70% 60%, ${alpha(theme.palette.secondary.main, 0.08)} 0%, transparent 50%)
								`,
								pointerEvents: 'none',
							}}
						/>
						<Box
							sx={{
								width: 200,
								height: 200,
								borderRadius: '50%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
								mb: 4,
								position: 'relative',
								'&::before': {
									content: '""',
									position: 'absolute',
									inset: -8,
									borderRadius: '50%',
									border: `4px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
									animation: 'rotate 30s linear infinite',
									'@keyframes rotate': {
										'0%': { transform: 'rotate(0deg)' },
										'100%': { transform: 'rotate(360deg)' },
									},
								},
							}}
						>
							<Icon 
								sx={{ 
									fontSize: 120,
									color: theme.palette.primary.main,
									opacity: 0.15,
									position: 'relative',
									zIndex: 1,
								}}
							>
								chat_bubble_outline
							</Icon>
						</Box>
						<Typography 
							variant="h4" 
							sx={{ 
								mt: 3,
								fontWeight: 700,
								background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
								backgroundClip: 'text',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent',
								mb: 1,
							}}
						>
							Select a conversation
						</Typography>
						<Typography 
							variant="body1" 
							sx={{ 
								mt: 1,
								color: theme.palette.text.secondary,
								maxWidth: 400,
								textAlign: 'center',
							}}
						>
							Choose a conversation from the sidebar to start chatting with your customers
						</Typography>
					</Box>
				)}
			</Box>
		</Box>
	);
}

export default MessagesAppContent;

