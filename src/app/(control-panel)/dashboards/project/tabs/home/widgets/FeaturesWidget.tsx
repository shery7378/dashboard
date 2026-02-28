import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { memo, useState } from 'react';
import { useRouter } from 'next/navigation';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FuseLoading from '@fuse/core/FuseLoading';
import WidgetDataType from './types/WidgetDataType';
import { useGetProjectDashboardWidgetsQuery } from '../../../ProjectDashboardApi';

/**
 * The FeaturesWidget widget.
 */
function FeaturesWidget() {
	const router = useRouter();

	const [selectedPeriod, setSelectedPeriod] = useState<'7days' | '15days' | '30days' | 'all'>('all');

	const { data: widgets, isLoading, refetch } = useGetProjectDashboardWidgetsQuery({
		dateRange: selectedPeriod
	});

	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const menuOpen = Boolean(anchorEl);

	const widget = widgets?.features as WidgetDataType;
	const data = widget?.data;
	const title = widget?.title;

	const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
	};

	const handleRefresh = () => {
		refetch();
		handleMenuClose();
	};

	const handle7Days = () => {
		setSelectedPeriod('7days');
		handleMenuClose();
	};

	const handle15Days = () => {
		setSelectedPeriod('15days');
		handleMenuClose();
	};

	const handle30Days = () => {
		setSelectedPeriod('30days');
		handleMenuClose();
	};

	const handleAllDays = () => {
		setSelectedPeriod('all');
		handleMenuClose();
	};

	if (isLoading) {
		return <FuseLoading />;
	}

	if (!widget || !widget.data) {
		// Return a placeholder if widget data is not available
		return (
			<Paper className="flex flex-col flex-auto shadow-sm rounded-xl overflow-hidden">
				<div className="flex items-center justify-between px-2 pt-2">
					<Typography
						className="px-3 text-lg font-semibold tracking-tight leading-6 truncate"
						color="text.primary"
					>
						Total Amount
					</Typography>

					<IconButton aria-label="more" onClick={handleMenuOpen} size="small">
						<FuseSvgIcon>heroicons-outline:ellipsis-vertical</FuseSvgIcon>
					</IconButton>
				</div>

				<div className="text-center mt-4">
					<Typography className="text-5xl sm:text-6xl font-bold tracking-tight leading-none text-green-500">
						£0.00
					</Typography>

					<Typography className="text-base font-semibold text-green-600 mt-2">
						Total Amount
					</Typography>
				</div>

				<Typography
					className="flex items-baseline justify-center w-full mt-5 mb-6 space-x-2"
					color="text.secondary"
				>
					<span className="truncate">Today's Amount:</span>
					<b>£0.00</b>
				</Typography>

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
					<MenuItem onClick={handle7Days}>
						<FuseSvgIcon className="mr-2">heroicons-outline:calendar-days</FuseSvgIcon>
						7 Days
					</MenuItem>

					<MenuItem onClick={handle15Days}>
						<FuseSvgIcon className="mr-2">heroicons-outline:calendar-days</FuseSvgIcon>
						15 Days
					</MenuItem>

					<MenuItem onClick={handle30Days}>
						<FuseSvgIcon className="mr-2">heroicons-outline:calendar-days</FuseSvgIcon>
						30 Days
					</MenuItem>

					<MenuItem onClick={handleAllDays}>
						<FuseSvgIcon className="mr-2">heroicons-outline:calendar-days</FuseSvgIcon>
						All Days
					</MenuItem>

					<MenuItem onClick={handleRefresh}>
						<FuseSvgIcon className="mr-2">heroicons-outline:arrow-path</FuseSvgIcon>
						Refresh
					</MenuItem>
				</Menu>
			</Paper>
		);
	}

	return (
		<Paper className="flex flex-col flex-auto shadow-sm rounded-xl overflow-hidden">
			<div className="flex items-center justify-between px-2 pt-2">
				<Typography
					className="px-3 text-lg font-semibold tracking-tight leading-6 truncate"
					color="text.primary"
				>
					{title || ''}
				</Typography>

				<IconButton
					aria-label="more"
					onClick={handleMenuOpen}
					size="small"
				>
					<FuseSvgIcon>heroicons-outline:ellipsis-vertical</FuseSvgIcon>
				</IconButton>
			</div>

			<div className="text-center mt-4">
				<Typography className="text-5xl sm:text-6xl font-bold tracking-tight leading-none text-green-500">
					{typeof data?.count === 'number' && data.count > 0
						? `£${Number(data.count).toLocaleString('en-GB', {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2
						})}`
						: '£0.00'}
				</Typography>

				<Typography className="text-base font-semibold text-green-600 mt-2">
					{data?.name ?? ''}
				</Typography>
			</div>

			<Typography
				className="flex items-baseline justify-center w-full mt-5 mb-6 space-x-2"
				color="text.secondary"
			>
				<span className="truncate">{data?.extra?.name ?? ''}:</span>

				<b>
					{typeof data?.extra?.count === 'number' && data.extra.count > 0
						? `£${Number(data.extra.count).toLocaleString('en-GB', {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2
						})}`
						: '£0.00'}
				</b>
			</Typography>

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
				<MenuItem onClick={handle7Days}>
					<FuseSvgIcon className="mr-2">heroicons-outline:calendar-days</FuseSvgIcon>
					7 Days
				</MenuItem>

				<MenuItem onClick={handle15Days}>
					<FuseSvgIcon className="mr-2">heroicons-outline:calendar-days</FuseSvgIcon>
					15 Days
				</MenuItem>

				<MenuItem onClick={handle30Days}>
					<FuseSvgIcon className="mr-2">heroicons-outline:calendar-days</FuseSvgIcon>
					30 Days
				</MenuItem>

				<MenuItem onClick={handleAllDays}>
					<FuseSvgIcon className="mr-2">heroicons-outline:calendar-days</FuseSvgIcon>
					All Days
				</MenuItem>

				<MenuItem onClick={handleRefresh}>
					<FuseSvgIcon className="mr-2">heroicons-outline:arrow-path</FuseSvgIcon>
					Refresh
				</MenuItem>
			</Menu>
		</Paper>
	);
}

export default memo(FeaturesWidget);