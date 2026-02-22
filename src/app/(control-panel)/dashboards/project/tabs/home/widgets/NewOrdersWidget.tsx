import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { memo } from 'react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FuseLoading from '@fuse/core/FuseLoading';
import { useGetProjectDashboardWidgetsQuery } from '../../../ProjectDashboardApi';
import WidgetDataType from './types/WidgetDataType';

/**
 * The NewOrdersWidget widget.
 * Shows New Orders (orders created today) in simple card style.
 */
function NewOrdersWidget() {
	const { data: widgets, isLoading } = useGetProjectDashboardWidgetsQuery();
	const widget = widgets?.newOrders as WidgetDataType;

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
						New Orders
					</Typography>
					<IconButton aria-label="more">
						<FuseSvgIcon>heroicons-outline:ellipsis-vertical</FuseSvgIcon>
					</IconButton>
				</div>
				<div className="text-center mt-4">
					<Typography className="text-6xl sm:text-7xl font-bold tracking-tight leading-none text-blue-500">
						0
					</Typography>
					<Typography className="text-base font-semibold text-blue-600 mt-2">New Orders</Typography>
				</div>
				<Typography
					className="flex items-baseline justify-center w-full mt-5 mb-6 space-x-2"
					color="text.secondary"
				>
					<span className="truncate">Today:</span>
					<b>0</b>
				</Typography>
			</Paper>
		);
	}

	const { data, title } = widget || {};

	return (
		<Paper className="flex flex-col flex-auto shadow-sm rounded-xl overflow-hidden">
			<div className="flex items-center justify-between px-2 pt-2">
				<Typography
					className="px-3 text-lg font-semibold tracking-tight leading-6 truncate"
					color="text.primary"
				>
					{title || 'New Orders'}
				</Typography>
				<IconButton aria-label="more">
					<FuseSvgIcon>heroicons-outline:ellipsis-vertical</FuseSvgIcon>
				</IconButton>
			</div>
			<div className="text-center mt-4">
				<Typography className="text-6xl sm:text-7xl font-bold tracking-tight leading-none text-blue-500">
					{String(data?.count ?? 0)}
				</Typography>
				<Typography className="text-base font-semibold text-blue-600 mt-2">
					{data?.name ?? 'New Orders'}
				</Typography>
			</div>
			<Typography
				className="flex items-baseline justify-center w-full mt-5 mb-6 space-x-2"
				color="text.secondary"
			>
				<span className="truncate">{data?.extra?.name ?? 'Today'}:</span>
				<b>{String(data?.extra?.count ?? 0)}</b>
			</Typography>
		</Paper>
	);
}

export default memo(NewOrdersWidget);
