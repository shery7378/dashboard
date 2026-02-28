import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { memo, useState } from 'react';
import { useRouter } from 'next/navigation';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FuseLoading from '@fuse/core/FuseLoading';
import { useGetProjectDashboardWidgetsQuery } from '../../../ProjectDashboardApi';
import WidgetDataType from './types/WidgetDataType';

/**
 * The IssuesWidget widget.
 */
function IssuesWidget() {
	const router = useRouter();
	const { data: widgets, isLoading, refetch } = useGetProjectDashboardWidgetsQuery();
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const menuOpen = Boolean(anchorEl);

	const widget = widgets?.issues as WidgetDataType;

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

	const handleAddProduct = () => {
		router.push('/apps/e-commerce/products/new');
		handleMenuClose();
	};

	if (isLoading) {
		return <FuseLoading />;
	}

	if (!widget) {
		return null;
	}

	const { data, title } = widget || {};

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
				<Typography className="text-6xl sm:text-7xl font-bold tracking-tight leading-none text-amber-500">
					{String(data?.count ?? 0)}
				</Typography>
				<Typography className="text-base font-semibold text-amber-600 mt-2">{data?.name ?? ''}</Typography>
			</div>
			<Typography
				className="flex items-baseline justify-center w-full mt-5 mb-6 space-x-2"
				color="text.secondary"
			>
				<span className="truncate">{data?.extra?.name ?? ''}:</span>
				<b>{String(data?.extra?.count ?? 0)}</b>
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
				<MenuItem onClick={handleAddProduct}>
					<FuseSvgIcon className="mr-2">heroicons-outline:plus</FuseSvgIcon>
					Add Product
				</MenuItem>
				<MenuItem onClick={handleRefresh}>
					<FuseSvgIcon className="mr-2">heroicons-outline:arrow-path</FuseSvgIcon>
					Refresh
				</MenuItem>
			</Menu>
		</Paper>
	);
}

export default memo(IssuesWidget);
