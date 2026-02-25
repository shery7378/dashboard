'use client';

import { memo, useMemo } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { ApexOptions } from 'apexcharts';
import { useAppSelector } from 'src/store/hooks';
import GenderWidgetType from './types/GenderWidgetType';
import { selectWidget } from '../AnalyticsDashboardApi';
import dynamic from 'next/dynamic';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
	ssr: false,
	loading: () => <Skeleton variant="rounded" height={192} />
});

const selectGender = selectWidget<GenderWidgetType>('gender');

function GenderWidget() {
	const theme = useTheme();
	const widget = useAppSelector(selectGender);
	const series = widget?.series;
	const labels = widget?.labels;
	const uniqueVisitors = widget?.uniqueVisitors ?? 0;

	const chartOptions = useMemo<ApexOptions>(
		() => ({
			chart: {
				animations: { speed: 400, animateGradually: { enabled: false } },
				fontFamily: 'inherit',
				foreColor: 'inherit',
				height: '100%',
				type: 'donut',
				sparkline: { enabled: true }
			},
			colors: ['#319795', '#4FD1C5'],
			labels: labels ?? [],
			plotOptions: {
				pie: { customScale: 0.9, expandOnClick: false, donut: { size: '70%' } }
			},
			stroke: { colors: [theme.palette.background.paper] },
			series,
			states: {
				hover: { filter: { type: 'none' } },
				active: { filter: { type: 'none' } }
			},
			tooltip: {
				enabled: true,
				fillSeriesColor: false,
				theme: 'dark',
				custom: ({
					seriesIndex,
					w
				}: {
					seriesIndex: number;
					w: { config: { colors: string[]; labels: string[]; series: string[] } };
				}) =>
					`<div class="flex items-center h-32 min-h-32 max-h-23 px-12">
            <div class="w-12 h-12 rounded-full" style="background-color: ${w.config.colors[seriesIndex]};"></div>
            <div class="ml-8 text-md leading-none">${w.config.labels[seriesIndex]}:</div>
            <div class="ml-8 text-md font-bold leading-none">${w.config.series[seriesIndex]}%</div>
        </div>`
			}
		}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[theme.palette.background.paper, labels, series]
	);

	if (!widget) {
		return (
			<Paper className="flex flex-col flex-auto shadow-sm rounded-xl overflow-hidden p-4">
				<Skeleton variant="text" width={80} height={28} />
				<Skeleton variant="circular" width={160} height={160} sx={{ mt: 3, alignSelf: 'center' }} />
				<Skeleton variant="text" width="100%" sx={{ mt: 3 }} />
				<Skeleton variant="text" width="100%" />
			</Paper>
		);
	}

	return (
		<Paper className="flex flex-col flex-auto shadow-sm rounded-xl overflow-hidden p-4">
			<div className="flex flex-col sm:flex-row items-start justify-between">
				<Typography className="text-lg font-medium tracking-tight leading-6 truncate">Gender</Typography>
				<div className="ml-2">
					<Chip size="small" className="font-medium text-sm" label=" 30 days" />
				</div>
			</div>
			<div className="flex flex-col flex-auto mt-6 h-48">
				<ReactApexChart
					className="flex flex-auto items-center justify-center w-full h-full"
					options={chartOptions}
					series={series}
					type={chartOptions?.chart?.type}
					height={chartOptions?.chart?.height}
				/>
			</div>
			<div className="mt-8">
				<div className="-my-3 divide-y">
					{series?.map((dataset, i) => (
						<div className="grid grid-cols-3 py-3" key={i}>
							<div className="flex items-center">
								<Box
									className="shrink-0 w-2 h-2 rounded-full"
									sx={{ backgroundColor: chartOptions?.colors?.[i] as string }}
								/>
								<Typography className="ml-3 truncate">{labels?.[i]}</Typography>
							</div>
							<Typography className="font-medium text-right">
								{Math.round((uniqueVisitors * dataset) / 100).toLocaleString('en-US')}
							</Typography>
							<Typography className="text-right" color="text.secondary">
								{dataset}%
							</Typography>
						</div>
					))}
				</div>
			</div>
		</Paper>
	);
}

export default memo(GenderWidget);
