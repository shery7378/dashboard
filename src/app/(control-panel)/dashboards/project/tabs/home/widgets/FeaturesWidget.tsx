import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { memo } from 'react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FuseLoading from '@fuse/core/FuseLoading';
import WidgetDataType from './types/WidgetDataType';
import { useGetProjectDashboardWidgetsQuery } from '../../../ProjectDashboardApi';

/**
 * The FeaturesWidget widget.
 */
function FeaturesWidget() {
	const { data: widgets, isLoading } = useGetProjectDashboardWidgetsQuery();
	const widget = widgets?.features as WidgetDataType;
	const data = widget?.data;
	const title = widget?.title;

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
					<IconButton aria-label="more">
						<FuseSvgIcon>heroicons-outline:ellipsis-vertical</FuseSvgIcon>
					</IconButton>
				</div>
				<div className="text-center mt-4">
					<Typography className="text-5xl sm:text-6xl font-bold tracking-tight leading-none text-green-500">
						£0.00
					</Typography>
					<Typography className="text-base font-semibold text-green-600 mt-2">Total Amount</Typography>
				</div>
				<Typography
					className="flex items-baseline justify-center w-full mt-5 mb-6 space-x-2"
					color="text.secondary"
				>
					<span className="truncate">Today's Amount:</span>
					<b>£0.00</b>
				</Typography>
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
				<IconButton aria-label="more">
					<FuseSvgIcon>heroicons-outline:ellipsis-vertical</FuseSvgIcon>
				</IconButton>
			</div>
			<div className="text-center mt-4">
				<Typography className="text-5xl sm:text-6xl font-bold tracking-tight leading-none text-green-500">
					{typeof data?.count === 'number' && data.count > 0
						? `£${Number(data.count).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
						: '£0.00'}
				</Typography>
				<Typography className="text-base font-semibold text-green-600 mt-2">{data?.name ?? ''}</Typography>
			</div>
			<Typography
				className="flex items-baseline justify-center w-full mt-5 mb-6 space-x-2"
				color="text.secondary"
			>
				<span className="truncate">{data?.extra?.name ?? ''}:</span>
				<b>
					{typeof data?.extra?.count === 'number' && data.extra.count > 0
						? `£${Number(data.extra.count).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
						: '£0.00'}
				</b>
			</Typography>
		</Paper>
	);
}

export default memo(FeaturesWidget);
