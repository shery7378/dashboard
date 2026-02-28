import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuItemComponent from '@mui/material/MenuItem';
import { memo, useState } from 'react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useAppSelector } from 'src/store/hooks';
import { selectWidget } from '../../../ProjectDashboardApi';
import WidgetDataType from './types/WidgetDataType';

/**
 * The IssuesWidget widget.
 */
function IssuesWidget() {
	const widget = useAppSelector(selectWidget<WidgetDataType>('issues')) as WidgetDataType;
	const data = widget?.data;
	const title = widget?.title;
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const menuOpen = Boolean(anchorEl);

	const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
	};

	const handleRefresh = () => {
		handleMenuClose();
	};

	const handleExport = () => {
		console.log('Export data');
		handleMenuClose();
	};

	const handleSettings = () => {
		console.log('Widget settings');
		handleMenuClose();
	};

	if (!widget || !data) {
		return (
			<Paper className="flex flex-col flex-auto shadow-sm overflow-hidden">
				<div className="flex items-center justify-between px-2 pt-2">
					<Skeleton
						variant="text"
						width={160}
						height={28}
						sx={{ ml: 1 }}
					/>
					<Skeleton
						variant="circular"
						width={32}
						height={32}
					/>
				</div>
				<div className="text-center mt-4">
					<Skeleton
						variant="text"
						sx={{ mx: 'auto' }}
						width={160}
						height={72}
					/>
					<IconButton onClick={handleMenuOpen} aria-label="more" size="small">
						<Skeleton variant="circular" width={24} height={24}>
							<FuseSvgIcon>heroicons-outline:ellipsis-vertical</FuseSvgIcon>
						</Skeleton>
					</IconButton>
				</div>
				<div className="text-center mt-4">
					<Skeleton
						variant="text"
						sx={{ mx: 'auto' }}
						width={160}
						height={72}
					/>
					<Skeleton
						variant="text"
						sx={{ mx: 'auto' }}
						width={120}
					/>
				</div>
				<Skeleton
					variant="text"
					sx={{ mx: 'auto' }}
					width={180}
				/>
			</Paper>
		);
	}

	return (
		<Paper className="flex flex-col flex-auto shadow-sm overflow-hidden">
			<div className="flex items-center justify-between px-2 pt-2">
				<Typography
					className="px-3 text-lg font-medium tracking-tight leading-6 truncate"
					color="text.secondary"
				>
					{title || 'Issues'}
				</Typography>
				<IconButton aria-label="more" onClick={handleMenuOpen} size="small">
					<FuseSvgIcon>heroicons-outline:ellipsis-vertical</FuseSvgIcon>
				</IconButton>
			</div>
			<div className="text-center mt-4">
				<Typography className="text-7xl sm:text-8xl font-bold tracking-tight leading-none text-amber-500">
					{String(data.count)}
				</Typography>
				<Typography className="text-lg font-medium text-amber-600">{data.name}</Typography>
			</div>
			<Typography
				className="flex items-baseline justify-center w-full mt-5 mb-6 space-x-2"
				color="text.secondary"
			>
				<span className="truncate">{data.extra.name}:</span>
				<b>{String(data.extra.count)}</b>
			</Typography>

			{/* Menu */}
			<Menu
				anchorEl={anchorEl}
				open={menuOpen}
				onClose={handleMenuClose}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'right'
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'right'
				}}
			>
				<MenuItemComponent onClick={handleRefresh}>
					<FuseSvgIcon className="mr-2">heroicons-outline:arrow-path</FuseSvgIcon>
					Refresh
				</MenuItemComponent>
				<MenuItemComponent onClick={handleExport}>
					<FuseSvgIcon className="mr-2">heroicons-outline:arrow-down-tray</FuseSvgIcon>
					Export
				</MenuItemComponent>
				<MenuItemComponent onClick={handleSettings}>
					<FuseSvgIcon className="mr-2">heroicons-outline:cog-6-tooth</FuseSvgIcon>
					Settings
				</MenuItemComponent>
			</Menu>
		</Paper>
	);
}

export default memo(IssuesWidget);
