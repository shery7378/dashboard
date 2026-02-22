import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { memo } from 'react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FuseLoading from '@fuse/core/FuseLoading';
import { useGetProjectDashboardWidgetsQuery } from '../../../ProjectDashboardApi';
import WidgetDataType from './types/WidgetDataType';

/**
 * The SummaryWidget widget.
 * Shows Pending Orders in simple card style.
 */
function SummaryWidget() {
	const { data: widgets, isLoading } = useGetProjectDashboardWidgetsQuery();
	const widget = widgets?.summary as WidgetDataType;
	const data = widget?.data;
	const title = widget?.title;

	if (isLoading) {
		return <FuseLoading />;
	}

	if (!widget || !data) {
		// Return a placeholder if widget data is not available
		return (
			<Paper className="flex flex-col flex-auto shadow-sm rounded-xl overflow-hidden">
				<div className="flex items-center justify-between px-2 pt-2">
					<Typography
						className="px-3 text-lg font-semibold tracking-tight leading-6 truncate"
						color="text.primary"
					>
						Pending Orders
					</Typography>
					<IconButton aria-label="more">
						<FuseSvgIcon>heroicons-outline:ellipsis-vertical</FuseSvgIcon>
					</IconButton>
				</div>
				<div className="text-center mt-4">
					<Typography className="text-6xl sm:text-7xl font-bold tracking-tight leading-none text-orange-500">
						0
					</Typography>
					<Typography className="text-base font-semibold text-orange-600 mt-2">Pending Orders</Typography>
				</div>
				<Typography
					className="flex items-baseline justify-center w-full mt-5 mb-6 space-x-2"
					color="text.secondary"
				>
					<span className="truncate">Total Pending:</span>
					<b>0</b>
				</Typography>
			</Paper>
		);
	}

	// Use 'DT' (Today) as default range for display
	const currentRange = 'DT';

	return (
		<Paper className="flex flex-col flex-auto shadow-sm rounded-xl overflow-hidden">
			<div className="flex items-center justify-between px-2 pt-2">
				<Typography
					className="px-3 text-lg font-semibold tracking-tight leading-6 truncate"
					color="text.primary"
				>
					{title || 'Pending Orders'}
				</Typography>
				<IconButton aria-label="more">
					<FuseSvgIcon>heroicons-outline:ellipsis-vertical</FuseSvgIcon>
				</IconButton>
			</div>
			<div className="text-center mt-4">
				<Typography className="text-6xl sm:text-7xl font-bold tracking-tight leading-none text-orange-500">
					{data?.count?.[currentRange] ?? 0}
				</Typography>
				<Typography className="text-base font-semibold text-orange-600 mt-2">
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
		</Paper>
	);
}

export default memo(SummaryWidget);
