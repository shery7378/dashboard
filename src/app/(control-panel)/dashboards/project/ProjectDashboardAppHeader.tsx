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

/**
 * The ProjectDashboardAppHeader page.
 */
function ProjectDashboardAppHeader() {
	const { data: user, isGuest } = useUser();

	// Assume user.storeAdded ya user.stores ki property hai
	const [openStoreDialog, setOpenStoreDialog] = useState(false);
	console.log(user, 'user from dashboard header');
	// Check store on mount
	useEffect(() => {
		if (user && !user.store_id && !user?.role?.includes("admin")) {
			setOpenStoreDialog(true);
		}
	}, [user]);

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
						src={user?.photoURL}
					>
						{user?.displayName?.[0]}
					</Avatar>
					<div className="flex flex-col min-w-0 mx-4">
						<PageBreadcrumb />
						<Typography className="text-2xl md:text-5xl font-semibold tracking-tight leading-7 md:leading-[1.375] truncate">
							{isGuest ? 'Hi Guest!' : `Welcome back, ${user?.displayName || user?.email}!`}
						</Typography>

						<div className="flex items-center mt-2">
							<FuseSvgIcon
								size={20}
								color="action"
							>
								heroicons-solid:chart-bar
							</FuseSvgIcon>
							<Typography
								className="mx-1.5 leading-6 truncate text-base"
								color="text.secondary"
							>
								View detailed analytics and reports
							</Typography>
						</div>
					</div>
				</div>
				<div className="flex items-center mt-6 sm:mt-0 sm:mx-2 space-x-2">
					<Button
						className="whitespace-nowrap"
						variant="contained"
						color="primary"
						startIcon={<FuseSvgIcon size={20}>heroicons-solid:envelope</FuseSvgIcon>}
					>
						Messages
					</Button>
					<Button
						className="whitespace-nowrap"
						variant="contained"
						color="secondary"
						startIcon={<FuseSvgIcon size={20}>heroicons-solid:cog-6-tooth</FuseSvgIcon>}
					>
						Settings
					</Button>
				</div>
			</div>
			<Dialog open={openStoreDialog}>
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
							// Redirect to store add page
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

export default ProjectDashboardAppHeader;
