import FuseScrollbars from '@fuse/core/FuseScrollbars';
import { styled } from '@mui/material/styles';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import { useSnackbar } from 'notistack';
import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import Button from '@mui/material/Button';
import _ from 'lodash';
import usePathname from '@fuse/hooks/usePathname';
import NotificationCard from './NotificationCard';
import { closeNotificationPanel, selectNotificationPanelState } from './notificationPanelSlice';
import {
	useCreateNotificationMutation,
	useDeleteNotificationMutation,
	useDeleteNotificationsMutation,
	useGetAllNotificationsQuery
} from './NotificationApi';
import { useUnreadMessagesCount } from '../messages/useUnreadMessagesCount';
import useUser from '@auth/useUser';

const StyledPopover = styled(Popover)(({ theme }) => ({
	'& .MuiPaper-root': {
		backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff',
		width: 380,
		maxWidth: '90vw',
		maxHeight: '80vh',
		boxShadow: theme.shadows[8],
		borderRadius: 8,
		marginTop: 8,
		overflow: 'hidden',
		color: theme.palette.text.primary,
		border: `1px solid ${theme.palette.divider}`
	}
}));

/**
 * The notification panel.
 */
function NotificationPanel() {
	const pathname = usePathname();
	const dispatch = useAppDispatch();
	const state = useAppSelector(selectNotificationPanelState);

	const [deleteNotification] = useDeleteNotificationMutation();

	const [deleteNotifications] = useDeleteNotificationsMutation();
	const [addNotification] = useCreateNotificationMutation();

	const { data: notifications } = useGetAllNotificationsQuery();
	const { unreadCount: unreadMessagesCount } = useUnreadMessagesCount();
	const { data: user } = useUser();

	const { enqueueSnackbar, closeSnackbar } = useSnackbar();

	// Close panel when navigating to a new page (but not when just opening it)
	const prevPathnameRef = useRef(pathname);
	useEffect(() => {
		// Only close if pathname actually changed (not on initial mount)
		if (prevPathnameRef.current !== pathname && prevPathnameRef.current !== null) {
			if (state) {
				dispatch(closeNotificationPanel());
			}
		}

		prevPathnameRef.current = pathname;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname, state]);

	// Disabled: Changelog notification
	// useEffect(() => {
	// 	// Only show changelog notification to admin users
	// 	const isAdmin = user?.role && Array.isArray(user.role) && user.role.includes('admin');
	//
	// 	if (!isAdmin) {
	// 		return; // Don't show notification to non-admin users
	// 	}

	// 	const item = NotificationModel({
	// 		title: 'New Fuse React version is released! ',
	// 		description: ' Checkout the release notes for more information. 🚀 ',
	// 		link: '/documentation/changelog',
	// 		icon: 'heroicons-solid:fire',
	// 		variant: 'secondary'
	// 	});

	// 	setTimeout(() => {
	// 		addNotification(item);

	// 		enqueueSnackbar(item.title, {
	// 			key: item.id,
	// 			autoHideDuration: 6000,
	// 			content: (
	// 				<NotificationTemplate
	// 					item={item}
	// 					onClose={() => {
	// 						closeSnackbar(item.id);
	// 					}}
	// 				/>
	// 			)
	// 		});
	// 	}, 2000);
	// }, [addNotification, closeSnackbar, enqueueSnackbar, user]);

	function handleDismiss(id: string) {
		deleteNotification(id);
	}

	function handleDismissAll() {
		deleteNotifications(notifications.map((notification) => notification.id));
	}

	// Get the anchor element (bell button)
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
	const anchorElRef = useRef<HTMLElement | null>(null);

	// Always try to keep anchorEl available
	useEffect(() => {
		const findButton = () => {
			const button = document.getElementById('notification-bell-button');

			if (button && button !== anchorElRef.current) {
				anchorElRef.current = button;
				setAnchorEl(button);
				return true;
			}

			return false;
		};

		// Try to find button on mount
		findButton();

		// Set up interval to check for button (in case it's rendered later)
		const intervalId = setInterval(() => {
			if (!anchorElRef.current) {
				findButton();
			}
		}, 500);

		return () => {
			clearInterval(intervalId);
		};
	}, []);

	// When state changes to true, ensure anchorEl is set
	useEffect(() => {
		if (state) {
			const findButton = () => {
				const button = document.getElementById('notification-bell-button');

				if (button) {
					anchorElRef.current = button;
					setAnchorEl(button);
					return true;
				}

				return false;
			};

			// Try immediately
			if (!findButton()) {
				// Retry in next animation frame
				requestAnimationFrame(() => {
					findButton();
				});

				// Final retry after a short delay
				setTimeout(() => {
					findButton();
				}, 200);
			}
		}
	}, [state]);

	const handleClose = () => {
		dispatch(closeNotificationPanel());
	};

	const handlePopoverClose = (event: React.MouseEvent | React.KeyboardEvent | React.FocusEvent) => {
		if (event.type === 'keydown' && (event as React.KeyboardEvent).key !== 'Escape') {
			return;
		}

		handleClose();
	};

	// Use a fallback anchor position if button not found
	const getAnchorPosition = () => {
		if (anchorEl) {
			return anchorEl;
		}

		// Fallback: try to find button one more time
		const button = document.getElementById('notification-bell-button');

		if (button) {
			setAnchorEl(button);
			anchorElRef.current = button;
			return button;
		}

		// Ultimate fallback: return null but still try to open with default position
		return null;
	};

	const anchorPosition = state ? getAnchorPosition() : null;
	// Allow popup to open even if anchor isn't found yet
	const shouldOpen = state;

	// If state is true but anchorEl is null, keep trying to find it
	if (state && !anchorPosition) {
		setTimeout(() => {
			const button = document.getElementById('notification-bell-button');

			if (button) {
				setAnchorEl(button);
				anchorElRef.current = button;
			}
		}, 50);
	}

	// Calculate fallback position
	const getFallbackPosition = () => {
		if (typeof window === 'undefined') return { top: 80, left: 0 };

		return {
			top: 80,
			left: window.innerWidth - 400
		};
	};

	return (
		<StyledPopover
			open={shouldOpen}
			anchorEl={anchorPosition || undefined}
			anchorReference={anchorPosition ? 'anchorEl' : 'anchorPosition'}
			anchorPosition={!anchorPosition ? getFallbackPosition() : undefined}
			onClose={handlePopoverClose}
			disablePortal={false}
			anchorOrigin={{
				vertical: 'bottom',
				horizontal: 'right'
			}}
			transformOrigin={{
				vertical: 'top',
				horizontal: 'right'
			}}
			PaperProps={{
				sx: {
					mt: 1.5,
					maxHeight: 'calc(100vh - 100px)',
					overflow: 'hidden',
					zIndex: 1300 // Ensure it's above most other elements
				}
			}}
			sx={{
				zIndex: 1300
			}}
		>
			<div
				className="flex flex-col"
				style={{ width: 380, maxWidth: '90vw' }}
			>
				{/* Header */}
				<div
					className="flex items-center justify-between p-4 border-b border-divider"
					style={{ backgroundColor: 'transparent' }}
				>
					<Typography
						className="text-lg font-semibold"
						sx={{
							color: '#000000',
							fontWeight: 600
						}}
					>
						Notifications
					</Typography>
					{notifications && notifications?.length > 0 && (
						<Typography
							className="cursor-pointer text-sm underline"
							sx={{
								color: 'primary.main',
								'&:hover': {
									color: 'primary.dark'
								}
							}}
							onClick={handleDismissAll}
						>
							Clear all
						</Typography>
					)}
				</div>

				{/* Content */}
				<FuseScrollbars
					className="flex flex-col"
					style={{
						maxHeight: '60vh',
						backgroundColor: 'transparent'
					}}
				>
					<div
						className="flex flex-col p-2"
						style={{ backgroundColor: 'transparent' }}
					>
						{/* Unread Messages Section */}
						{unreadMessagesCount > 0 && (
							<div
								className="mb-3 p-3 rounded-lg"
								style={{
									backgroundColor: 'rgba(25, 118, 210, 0.1)'
								}}
							>
								<Typography
									className="text-sm font-semibold mb-2"
									sx={{
										color: '#000000',
										fontWeight: 600
									}}
								>
									{unreadMessagesCount} Unread Message{unreadMessagesCount > 1 ? 's' : ''}
								</Typography>
								<Button
									variant="contained"
									size="small"
									fullWidth
									onClick={() => {
										window.location.href = '/apps/messages';
										handleClose();
									}}
									sx={{
										backgroundColor: 'primary.main',
										color: 'primary.contrastText',
										'&:hover': {
											backgroundColor: 'primary.dark'
										}
									}}
								>
									View Messages
								</Button>
							</div>
						)}

						{/* System Notifications Section */}
						{notifications && notifications?.length > 0 ? (
							<div>
								{_.orderBy(notifications, ['time'], ['desc']).map((item) => (
									<NotificationCard
										key={item.id}
										className="mb-2"
										item={item}
										onClose={handleDismiss}
									/>
								))}
							</div>
						) : (
							// Only show "No notifications" if there are no system notifications AND no unread messages
							!unreadMessagesCount && (
								<div className="flex flex-1 items-center justify-center p-8">
									<Typography
										className="text-center"
										sx={{
											color: '#000000',
											fontSize: '0.875rem'
										}}
									>
										No notifications
									</Typography>
								</div>
							)
						)}
					</div>
				</FuseScrollbars>
			</div>
		</StyledPopover>
	);
}

export default NotificationPanel;
