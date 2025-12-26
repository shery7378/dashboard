import { alpha, ThemeProvider, useTheme } from '@mui/material/styles';
import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ApexOptions } from 'apexcharts';
import Skeleton from '@mui/material/Skeleton';

import { private_safeDarken } from '@mui/system/colorManipulator';
import { useAppSelector } from 'src/store/hooks';
import _ from 'lodash';
import FuseTabs from 'src/components/tabs/FuseTabs';
import FuseTab from 'src/components/tabs/FuseTab';
import { useContrastMainTheme } from '@fuse/core/FuseSettings/hooks/fuseThemeHooks';
import VisitorsOverviewWidgetType from './types/VisitorsOverviewWidgetType';
import { selectWidget } from '../AnalyticsDashboardApi';
import dynamic from 'next/dynamic';
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

/**
 * The visitors overview widget.
 */
function VisitorsOverviewWidget() {
	const theme = useTheme();
	const contrastTheme = useContrastMainTheme(theme.palette.primary.dark);
	const widget = useAppSelector(selectWidget<VisitorsOverviewWidgetType>('visitors'));
	const series = widget?.series;
	const ranges = widget?.ranges;
	const [tabValue, setTabValue] = useState(0);
	const currentRange = Object.keys(ranges || {})[tabValue];

	const memoChartOptions: ApexOptions = useMemo(() => ({
		chart: {
			animations: {
				speed: 400,
				animateGradually: {
					enabled: false
				}
			},
			fontFamily: 'inherit',
			foreColor: 'inherit',
			width: '100%',
			height: '100%',
			type: 'area',
			toolbar: {
				show: false
			},
			zoom: {
				enabled: false
			}
		},
		colors: [contrastTheme.palette.secondary.light],
		dataLabels: { enabled: false },
		fill: { colors: [contrastTheme.palette.secondary.dark] },
		grid: {
			show: true,
			borderColor: alpha(contrastTheme.palette.primary.contrastText, 0.1),
			padding: { top: 10, bottom: -40, left: 0, right: 0 },
			position: 'back',
			xaxis: { lines: { show: true } }
		},
		stroke: { width: 2 },
		tooltip: {
			followCursor: true,
			theme: 'dark',
			x: { format: 'MMM dd, yyyy' },
			y: { formatter: (value) => `${value}` }
		},
		xaxis: {
			axisBorder: { show: false },
			axisTicks: { show: false },
			crosshairs: {
				stroke: { color: contrastTheme.palette.secondary.main, dashArray: 0, width: 2 }
			},
			labels: { offsetY: -20, style: { colors: contrastTheme.palette.primary.contrastText } },
			tickAmount: 20,
			tooltip: { enabled: false },
			type: 'datetime'
		},
		yaxis: { axisTicks: { show: false }, axisBorder: { show: false }, min: (min) => min - 750, max: (max) => max + 250, tickAmount: 5, show: false }
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}), [contrastTheme.palette.primary.contrastText, contrastTheme.palette.primary.contrastTextChannel, contrastTheme.palette.secondary.dark, contrastTheme.palette.secondary.light, contrastTheme.palette.secondary.main]);

	const memoSeries = useMemo(() => (currentRange && series ? [...(series[currentRange] || [])] : []), [currentRange, series]);

	if (!widget) {
		return (
			<Box className="sm:col-span-2 lg:col-span-3">
				<Skeleton variant="rounded" height={280} />
			</Box>
		);
	}

	return (
		<ThemeProvider theme={contrastTheme}>
			<Box
				className="sm:col-span-2 lg:col-span-3 dark flex flex-col flex-auto shadow-sm rounded-xl overflow-hidden"
				sx={{
					background: private_safeDarken(contrastTheme.palette.primary.main, 0.1),
					color: contrastTheme.palette.primary.contrastText
				}}
			>
				<div className="flex justify-between mt-3 mx-3 md:mt-6 md:mx-6">
					<div className="flex flex-col">
						<Typography
							sx={{
								color: contrastTheme.palette.primary.contrastText
							}}
							className="mr-4 text-2xl md:text-3xl font-semibold tracking-tight leading-7"
						>
							Visitors Overview
						</Typography>
						<Typography
							className="font-medium"
							sx={{
								color: `rgba(${contrastTheme.palette.primary.contrastTextChannel} / 0.7)`
							}}
						>
							Number of unique visitors
						</Typography>
					</div>
					<div className="">
						<FuseTabs
							value={tabValue}
							onChange={(_ev, value: number) => setTabValue(value)}
						>
							{Object.entries(ranges).map(([key, label]) => (
								<FuseTab
									key={key}
									label={label}
								/>
							))}
						</FuseTabs>
					</div>
				</div>

				<div className="flex flex-col flex-auto h-80">
					<ReactApexChart
						options={memoChartOptions}
						series={memoSeries}
						type={memoChartOptions?.chart?.type}
						height={memoChartOptions?.chart?.height}
					/>
				</div>
			</Box>
		</ThemeProvider>
	);
}

export default VisitorsOverviewWidget;
