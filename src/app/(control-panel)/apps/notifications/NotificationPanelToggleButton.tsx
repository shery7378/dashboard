import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'motion/react';
import { useTheme } from '@mui/material';
import clsx from 'clsx';
import { toggleNotificationPanel, openNotificationPanel, closeNotificationPanel, selectNotificationPanelState } from './notificationPanelSlice';
import { useGetAllNotificationsQuery } from './NotificationApi';
import { useUnreadMessagesCount } from '../messages/useUnreadMessagesCount';

type NotificationPanelToggleButtonProps = {
	className?: string;
	children?: ReactNode;
};

/**
 * The notification panel toggle button.
 */

function NotificationPanelToggleButton(props: NotificationPanelToggleButtonProps) {
	const {
		className = '',
		children = (
			<FuseSvgIcon
				size={20}
				sx={(theme) => ({
					color: theme.vars.palette.text.secondary,
					...theme.applyStyles('dark', {
						color: theme.vars.palette.text.primary
					})
				})}
			>
				heroicons-outline:bell
			</FuseSvgIcon>
		)
	} = props;
	const { data: notifications } = useGetAllNotificationsQuery();
	const { unreadCount: unreadMessagesCount = 0 } = useUnreadMessagesCount();
	const panelState = useAppSelector(selectNotificationPanelState);
	
	const [animate, setAnimate] = useState(false);
	const prevNotificationCount = useRef(notifications?.length || 0);
	const prevUnreadMessagesCount = useRef(unreadMessagesCount);
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const controls = useAnimation();

	// Calculate total count (notifications + unread messages)
	const notificationCount = notifications?.length || 0;
	const totalCount = notificationCount + unreadMessagesCount;

	useEffect(() => {
		if (animate) {
			controls.start({
				rotate: [0, 20, -20, 0],
				color: [theme.vars.palette.secondary.main],
				transition: { duration: 0.2, repeat: 5 }
			});
		} else {
			controls.start({
				rotate: 0,
				scale: 1,
				color:
					theme.palette.mode === 'dark' ? theme.vars.palette.text.primary : theme.vars.palette.text.secondary
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [animate, controls]);

	useEffect(() => {
		// Animate when notifications or unread messages increase
		const currentNotificationCount = notifications?.length || 0;
		if (
			currentNotificationCount > prevNotificationCount.current ||
			unreadMessagesCount > prevUnreadMessagesCount.current
		) {
			setAnimate(true);
			const timer = setTimeout(() => setAnimate(false), 1000); // Reset after 1 second
			return () => clearTimeout(timer);
		}

		prevNotificationCount.current = currentNotificationCount;
		prevUnreadMessagesCount.current = unreadMessagesCount;
		return undefined;
	}, [notifications?.length, unreadMessagesCount]);

	const buttonRef = useRef<HTMLButtonElement>(null);
	const lastClickTimeRef = useRef<number>(0);
	const CLICK_DEBOUNCE_MS = 300; // Prevent rapid clicks within 300ms

	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		
		// Debounce rapid clicks
		const now = Date.now();
		if (now - lastClickTimeRef.current < CLICK_DEBOUNCE_MS) {
			return;
		}
		lastClickTimeRef.current = now;
		
		// If panel is already supposed to be open but isn't showing, 
		// force it open instead of toggling
		if (panelState) {
			// State says open but popup isn't showing - force close then reopen
			dispatch(closeNotificationPanel());
			setTimeout(() => {
				dispatch(openNotificationPanel());
			}, 50);
		} else {
			// Panel is closed, open it
			dispatch(openNotificationPanel());
		}
	};

	return (
		<IconButton
			id="notification-bell-button"
			ref={buttonRef}
			onClick={handleClick}
			className={clsx('border border-divider', className)}
			aria-label="Notifications"
			disabled={false}
			sx={{ 
				position: 'relative',
				zIndex: 1000,
				pointerEvents: 'auto !important',
				cursor: 'pointer !important',
				'&:hover': {
					backgroundColor: 'action.hover',
					cursor: 'pointer'
				},
				'&:active': {
					cursor: 'pointer'
				}
			}}
		>
			<Badge
				color="error"
				badgeContent={totalCount > 0 ? (totalCount > 99 ? '99+' : totalCount) : undefined}
				max={99}
				invisible={totalCount === 0}
				sx={{
					'& .MuiBadge-badge': {
						pointerEvents: 'none',
						zIndex: 1001
					}
				}}
			>
				<motion.div 
					animate={controls}
					style={{ 
						pointerEvents: 'none',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center'
					}}
				>
					{children}
				</motion.div>
			</Badge>
		</IconButton>
	);
}

export default NotificationPanelToggleButton;
