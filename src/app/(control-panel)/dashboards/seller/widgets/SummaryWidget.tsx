import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import { memo, useState } from 'react';
import MenuItem from '@mui/material/MenuItem';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FuseLoading from '@fuse/core/FuseLoading';
import { useGetProjectDashboardWidgetsQuery } from '../../vendor/ProjectDashboardApi';
import WidgetDataType, { RangeType } from '../../vendor/tabs/home/widgets/types/WidgetDataType';

/**
 * The Seller SummaryWidget widget.
 */
function SummaryWidget() {
	const { data: widgets, isLoading } = useGetProjectDashboardWidgetsQuery();
	const widget = widgets?.summary as WidgetDataType;
	const data = widget?.data;
	const ranges = widget?.ranges;
	const currentRangeDefault = widget?.currentRange;

	const [currentRange, setCurrentRange] = useState<RangeType>(currentRangeDefault as RangeType);

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
					{ranges?.map((range) => (
						<MenuItem
							key={range}
							value={range}
						>
							{range}
						</MenuItem>
					))}
				</Select>
				<IconButton
					size="small"
					className=""
				>
					<FuseSvgIcon size={20}>heroicons-outline:ellipsis-vertical</FuseSvgIcon>
				</IconButton>
			</div>
			<div className="flex flex-col flex-auto p-6">
				<Typography className="text-2xl font-semibold leading-none">
					Seller Sales
				</Typography>
				<Typography
					className="text-lg font-medium leading-none mt-4"
					color="text.secondary"
				>
					{data?.value || '0'}
				</Typography>
				<Typography
					className="text-sm leading-none mt-4"
					color="text.secondary"
				>
					{data?.change || '0%'} from last period
				</Typography>
			</div>
		</Paper>
	);
}

export default memo(SummaryWidget);

