import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Menu from '@mui/material/Menu';
import MenuItemComponent from '@mui/material/MenuItem';
import { memo, useEffect, useState } from 'react';
import MenuItem from '@mui/material/MenuItem';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useAppSelector } from 'src/store/hooks';
import { selectWidget } from '../../../ProjectDashboardApi';
import WidgetDataType, { RangeType } from './types/WidgetDataType';

/**
 * The SummaryWidget widget.
 */
function SummaryWidget() {
	const widget = useAppSelector(selectWidget<WidgetDataType>('summary'));
	const data = widget?.data;
	const ranges = widget?.ranges;
	const currentRangeDefault = widget?.currentRange;
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const menuOpen = Boolean(anchorEl);

	const [currentRange, setCurrentRange] = useState<RangeType>(
		(currentRangeDefault as RangeType) || ('this-week' as RangeType)
	);

	const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
	};

	const handleRefresh = () => {
		// Refresh functionality
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

	useEffect(() => {
		if (currentRangeDefault) {
			setCurrentRange(currentRangeDefault as RangeType);
		}
	}, [currentRangeDefault]);

	function handleChangeRange(event: SelectChangeEvent<string>) {
		setCurrentRange(event.target.value as RangeType);
	}

	if (!widget || !data || !ranges) {
		return (
			<Paper className="flex flex-col flex-auto shadow-sm overflow-hidden">
				<div className="flex items-center justify-between px-2 pt-2">
					<Skeleton
						variant="rounded"
						width={160}
						height={36}
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
					<Skeleton
						variant="text"
						sx={{ mx: 'auto' }}
						width={120}
					/>
				</div>
				<Skeleton
					variant="text"
					sx={{ mx: 'auto' }}
					width={200}
				/>
			</Paper>
		);
	}

	return (
		<Paper className="flex flex-col flex-auto shadow-sm overflow-hidden">
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
					{Object.entries(ranges).map(([key, n]) => {
						return (
							<MenuItem
								key={key}
								value={key}
							>
								{n}
							</MenuItem>
						);
					})}
				</Select>
				<IconButton
					aria-label="more"
					onClick={handleMenuOpen}
					size="small"
				>
					<FuseSvgIcon>heroicons-outline:ellipsis-vertical</FuseSvgIcon>
				</IconButton>
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
			</div>
			<div className="text-center mt-4">
				<Typography className="text-7xl sm:text-8xl font-bold tracking-tight leading-none text-blue-500">
					{data.count[currentRange]}
				</Typography>
				<Typography className="text-lg font-medium text-blue-600 dark:text-blue-500">Due Order</Typography>
			</div>
			<Typography
				className="flex items-baseline justify-center w-full mt-5 mb-6 space-x-2"
				color="text.secondary"
			>
				<span className="truncate">Completed:</span>
				<b>{data.extra.count[currentRange]}</b>
			</Typography>
		</Paper>
	);
}

export default memo(SummaryWidget);
