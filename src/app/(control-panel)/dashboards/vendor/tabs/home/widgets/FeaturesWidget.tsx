import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { memo } from 'react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
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

	if (isLoading || !widget || !data) {
		return (
			<Paper className="flex flex-col flex-auto shadow-sm overflow-hidden">
				<div className="flex items-center justify-between px-2 pt-2">
					<Skeleton
						variant="text"
						width={180}
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

	return (
		<Paper className="flex flex-col flex-auto shadow-sm overflow-hidden">
			<div className="flex items-center justify-between px-2 pt-2">
				<Typography
					className="px-3 text-lg font-medium tracking-tight leading-6 truncate"
					color="text.secondary"
				>
					Total Revenue
				</Typography>
				<IconButton aria-label="more">
					<FuseSvgIcon>heroicons-outline:ellipsis-vertical</FuseSvgIcon>
				</IconButton>
			</div>
			<div className="text-center mt-4">
				<Typography className="text-5xl sm:text-6xl font-bold tracking-tight leading-none text-green-500">
					£
					{parseFloat(String(data.count)).toLocaleString('en-GB', {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2
					})}
				</Typography>
				<Typography className="text-lg font-medium text-green-600">{data.name}</Typography>
			</div>
			<Typography
				className="flex items-baseline justify-center w-full mt-5 mb-6 space-x-2"
				color="text.secondary"
			>
				<span className="truncate">{data.extra.name}:</span>
				<b>
					£
					{parseFloat(String(data.extra.count)).toLocaleString('en-GB', {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2
					})}
				</b>
			</Typography>
		</Paper>
	);
}

export default memo(FeaturesWidget);
