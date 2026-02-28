import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuItemComponent from '@mui/material/MenuItem';
import { memo, useState } from 'react';
import MenuItem from '@mui/material/MenuItem';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FuseLoading from '@fuse/core/FuseLoading';
import { useGetProjectDashboardWidgetsQuery } from '../../vendor/ProjectDashboardApi';
import WidgetDataType, { RangeType } from '../../vendor/tabs/home/widgets/types/WidgetDataType';

/**
 * The Vendor SummaryWidget widget.
 * Shows Pending Orders with time range selector.
 */
function SummaryWidget() {
	const { data: widgets, isLoading } = useGetProjectDashboardWidgetsQuery();
	const widget = widgets?.summary as WidgetDataType;
	const data = widget?.data;
	const ranges = widget?.ranges || {};
	const currentRangeDefault = widget?.currentRange || 'DT';
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const menuOpen = Boolean(anchorEl);

	const [currentRange, setCurrentRange] = useState<RangeType>(currentRangeDefault as RangeType);

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

	function handleChangeRange(event: SelectChangeEvent<string>) {
		setCurrentRange(event.target.value as RangeType);
	}

	if (isLoading) {
		return <FuseLoading />;
	}

	if (!widget) {
		return null;
	}

	return (
		<Paper className="flex flex-col flex-auto shadow-sm rounded-xl overflow-hidden">
			<div className="flex items-center justify-between px-2 pt-2">
				<Select
					className=""
					classes={{ select: 'py-0 flex items-center' }}
					value={currentRange}
					onChange={handleChangeRange}
					slotProps={{
						input: {
							name: 'currentRange'
						}
					}}
					variant="filled"
				>
					{Object.entries(ranges || {}).map(([key, label]) => {
						return (
							<MenuItem
								key={key}
								value={key}
							>
								{label}
							</MenuItem>
						);
					})}
				</Select>
				<IconButton aria-label="more" onClick={handleMenuOpen} size="small">
					<FuseSvgIcon>heroicons-outline:ellipsis-vertical</FuseSvgIcon>
				</IconButton>
			</div>
			<div className="text-center mt-4">
				<Typography className="text-6xl sm:text-7xl font-bold tracking-tight leading-none text-orange-500">
					{data?.count?.[currentRange] ?? 0}
				</Typography>
				<Typography className="text-base font-semibold text-orange-600 dark:text-orange-500 mt-2">
					{data?.name ?? 'Pending Orders'}
				</Typography>
			</div>
			<Typography
				className="flex items-baseline justify-center w-full mt-5 mb-6 space-x-2"
				color="text.secondary"
			>
				<span className="truncate">{data?.extra?.name ?? 'Total Pending'}:</span>
				<b>{data?.extra?.count?.[currentRange] ?? 0}</b>
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

export default memo(SummaryWidget);
