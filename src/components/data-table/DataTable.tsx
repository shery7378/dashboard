import { MaterialReactTable, useMaterialReactTable, MaterialReactTableProps, MRT_Icons } from 'material-react-table';
import { useMemo, memo } from 'react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { Theme, Box, Skeleton } from '@mui/material';
import DataTableTopToolbar from './DataTableTopToolbar';

const tableIcons: Partial<MRT_Icons> = {
	ArrowDownwardIcon: (props) => (
		<FuseSvgIcon size={20} {...props}>heroicons-outline:arrow-down-circle</FuseSvgIcon>
	),
	ClearAllIcon: () => <FuseSvgIcon size={20}>heroicons-outline:adjustments-horizontal</FuseSvgIcon>,
	DensityLargeIcon: () => <FuseSvgIcon size={20}>heroicons-outline:bars-3-bottom-left</FuseSvgIcon>,
	DensityMediumIcon: () => <FuseSvgIcon size={20}>heroicons-outline:bars-3</FuseSvgIcon>,
	DensitySmallIcon: () => <FuseSvgIcon size={20}>heroicons-outline:bars-2</FuseSvgIcon>,
	DragHandleIcon: () => (
		<FuseSvgIcon className="rotate-45" size={14}>heroicons-outline:arrows-pointing-out</FuseSvgIcon>
	),
	FilterListIcon: (props) => (
		<FuseSvgIcon size={16} {...props}>heroicons-outline:funnel</FuseSvgIcon>
	),
	FilterListOffIcon: () => <FuseSvgIcon size={20}>heroicons-outline:funnel</FuseSvgIcon>,
	FullscreenExitIcon: () => <FuseSvgIcon size={20}>heroicons-outline:arrows-pointing-in</FuseSvgIcon>,
	FullscreenIcon: () => <FuseSvgIcon size={20}>heroicons-outline:arrows-pointing-out</FuseSvgIcon>,
	SearchIcon: (props) => (
		<FuseSvgIcon color="action" size={20} {...props}>heroicons-outline:magnifying-glass</FuseSvgIcon>
	),
	SearchOffIcon: () => <FuseSvgIcon size={20}>heroicons-outline:magnifying-glass</FuseSvgIcon>,
	ViewColumnIcon: () => <FuseSvgIcon size={20}>heroicons-outline:view-columns</FuseSvgIcon>,
	MoreVertIcon: () => <FuseSvgIcon size={20}>heroicons-outline:ellipsis-vertical</FuseSvgIcon>,
	MoreHorizIcon: () => <FuseSvgIcon size={20}>heroicons-outline:ellipsis-horizontal</FuseSvgIcon>,
	SortIcon: (props) => (
		<FuseSvgIcon size={20} {...props}>heroicons-outline:arrows-up-down</FuseSvgIcon>
	),
	PushPinIcon: (props) => (
		<FuseSvgIcon size={20} {...props}>heroicons-outline:bookmark</FuseSvgIcon>
	),
	VisibilityOffIcon: () => <FuseSvgIcon size={20}>heroicons-outline:eye-slash</FuseSvgIcon>
};

function DataTableComponent<TData>(props: MaterialReactTableProps<TData>) {
	const { columns, data, state, ...rest } = props;

	const defaults = useMemo(
		() =>
			({
				initialState: {
					density: 'comfortable',
					showColumnFilters: false,
					showGlobalFilter: true,
					columnPinning: {
						left: ['mrt-row-expand', 'mrt-row-select'],
						right: ['mrt-row-actions']
					},
					pagination: {
						pageSize: 15
					},
					enableFullScreenToggle: false
				},
				enableRowVirtualization: true,
				rowVirtualizerOptions: { overscan: 5 },
				autoResetPageIndex: false,
				enableColumnFilterModes: true,
				enableColumnOrdering: true,
				enableGrouping: true,
				enableColumnPinning: true,
				enableFacetedValues: true,
				enableRowActions: true,
				enableRowSelection: true,
				muiBottomToolbarProps: {
					className: 'flex items-center min-h-14 h-14 border-t-1 bg-gray-50/50'
				},
				muiTablePaperProps: {
					elevation: 0,
					square: true,
					className: 'flex flex-col flex-auto h-full border-none'
				},
				muiTableContainerProps: {
					className: 'flex-auto overflow-auto',
					sx: { maxHeight: 'calc(100vh - 280px)' }
				},
				enableStickyHeader: true,
				paginationDisplayMode: 'pages',
				positionToolbarAlertBanner: 'top',
				muiPaginationProps: {
					color: 'secondary',
					rowsPerPageOptions: [10, 15, 20, 50],
					shape: 'rounded',
					variant: 'outlined',
					showRowsPerPage: true
				},
				muiSearchTextFieldProps: {
					placeholder: 'Quick search...',
					sx: { minWidth: '320px' },
					variant: 'outlined',
					size: 'small'
				},
				muiFilterTextFieldProps: {
					variant: 'outlined',
					size: 'small',
				},
				muiSelectAllCheckboxProps: {
					className: 'w-12'
				},
				muiSelectCheckboxProps: {
					className: 'w-12 text-secondary'
				},
				muiTableBodyRowProps: ({ row, table }) => {
					const { density } = table.getState();
					return {
						sx: {
							transition: 'background-color 0.2s',
							'&:hover': {
								backgroundColor: (theme) => `${theme.palette.action.hover} !important`,
							},
							height: row.getIsPinned() ? (density === 'compact' ? 40 : 60) : undefined
						}
					};
				},
				muiTableHeadCellProps: ({ column }) => ({
					sx: (theme) => ({
						backgroundColor: column.getIsPinned() ? theme.palette.background.paper : theme.palette.background.default,
						fontWeight: 700,
						textTransform: 'uppercase',
						fontSize: '12px',
						letterSpacing: '0.05em',
						color: theme.palette.text.secondary,
						borderBottom: `2px solid ${theme.palette.divider}`,
					})
				}),
				mrtTheme: (theme) => ({
					baseBackgroundColor: theme.palette.background.paper,
					menuBackgroundColor: theme.palette.background.paper,
					pinnedRowBackgroundColor: theme.palette.background.paper,
					pinnedColumnBackgroundColor: theme.palette.background.paper
				}),
				renderTopToolbar: (_props) => <DataTableTopToolbar {..._props} />,
				icons: tableIcons
			}) as Partial<MaterialReactTableProps<TData>>,
		[]
	);

	// Custom Skeleton rendering when loading and no data
	const tableData = useMemo(() => {
		if (state?.isLoading && (!data || data.length === 0)) {
			return Array(10).fill({}) as TData[];
		}
		return data;
	}, [data, state?.isLoading]);

	const processedColumns = useMemo(() => {
		if (state?.isLoading && (!data || data.length === 0)) {
			return columns.map(col => ({
				...col,
				Cell: () => <Skeleton variant="text" width="80%" height={24} animation="wave" />,
			}));
		}
		return columns;
	}, [columns, data, state?.isLoading]);

	const tableOptions = useMemo(
		() => ({
			columns: processedColumns,
			data: tableData,
			...defaults,
			...rest,
			state: {
				...state,
				showSkeletons: state?.isLoading && (!data || data.length === 0),
			}
		}),
		[processedColumns, tableData, defaults, rest, state, data]
	);

	const tableInstance = useMaterialReactTable<TData>(tableOptions);

	return <MaterialReactTable table={tableInstance} />;
}

const DataTable = memo(DataTableComponent) as typeof DataTableComponent;

export default DataTable;

