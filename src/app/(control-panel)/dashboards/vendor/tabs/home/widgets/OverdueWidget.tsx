import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { memo } from 'react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useGetProjectDashboardWidgetsQuery } from '../../../ProjectDashboardApi';
import WidgetDataType from './types/WidgetDataType';

/**
 * The OverdueWidget widget.
 */
function OverdueWidget() {
	const { data: widgets, isLoading } = useGetProjectDashboardWidgetsQuery();
	const widget = widgets?.overdue as WidgetDataType;

	if (isLoading || !widget) {
		return (
			<Paper className="flex flex-col flex-auto shadow-sm overflow-hidden">
				<div className="flex items-center justify-between px-2 pt-2">
					<Skeleton
						variant="text"
						width={140}
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

	const { data, title } = widget;

	return (
		<Paper className="flex flex-col flex-auto shadow-sm overflow-hidden">
			<div className="flex items-center justify-between px-2 pt-2">
				<Typography
					className="px-3 text-lg font-medium tracking-tight leading-6 truncate"
					color="text.secondary"
				>
					Total Orders
				</Typography>
				<IconButton aria-label="more">
					<FuseSvgIcon>heroicons-outline:ellipsis-vertical</FuseSvgIcon>
				</IconButton>
			</div>
			<div className="text-center mt-4">
				<Typography className="text-7xl sm:text-8xl font-bold tracking-tight leading-none text-red-500">
					{String(data.count)}
				</Typography>
				<Typography className="text-lg font-medium text-red-600">Orders</Typography>
			</div>
			<Typography
				className="flex items-baseline justify-center w-full mt-5 mb-6 space-x-2"
				color="text.secondary"
			>
				<span className="truncate">{data.extra.name}:</span>
				<b>{String(data.extra.count)}</b>
			</Typography>
		</Paper>
	);
}

export default memo(OverdueWidget);
