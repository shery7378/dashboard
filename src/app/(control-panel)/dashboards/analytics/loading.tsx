'use client';

import PageHeader from '@/components/PageHeader';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

/**
 * Skeleton shown while a widget is loading
 */
function WidgetSkeleton({ height = 200 }: { height?: number }) {
	return (
		<Skeleton
			variant="rounded"
			height={height}
			sx={{ borderRadius: 3, width: '100%', opacity: 0.6 }}
		/>
	);
}

/**
 * Loading component for the Analytics Dashboard.
 * Mimics the look of the actual dashboard with skeletons to provide a seamless transition.
 */
function Loading() {
	return (
		<div className="w-full h-full flex flex-col">
			<PageHeader 
				title="Analytics Dashboard" 
				subtitle="Monitor metrics, check reports and review performance"
				actions={[
					{
						label: 'Settings',
						icon: 'heroicons-solid:cog-6-tooth',
						color: 'primary',
						hidden: true
					},
					{
						label: 'Export',
						icon: 'heroicons-solid:arrow-up-tray',
						color: 'secondary',
						hidden: true
					}
				]}
			/>
			<div className="flex-auto p-6 md:p-8 space-y-8">
				{/* KPI Summary Skeletons */}
				<Grid container spacing={3} sx={{ px: { xs: 2, md: 3 } }}>
					{[1, 2, 3, 4].map((i) => (
						<Grid item xs={12} sm={6} md={3} key={i}>
							<Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.05)' }}>
								<Skeleton variant="text" width="40%" height={20} className="mb-2" />
								<Skeleton variant="text" width="60%" height={48} />
								<Box sx={{ mt: 2 }}>
									<Skeleton variant="rounded" height={8} />
								</Box>
							</Paper>
						</Grid>
					))}
				</Grid>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
					{/* Visitors Overview */}
					<div className="sm:col-span-2 lg:col-span-3">
						<WidgetSkeleton height={280} />
					</div>

					{/* Three compact trend cards */}
					<div className="sm:col-span-2 lg:col-span-1">
						<WidgetSkeleton height={180} />
					</div>
					<div className="sm:col-span-2 lg:col-span-1">
						<WidgetSkeleton height={180} />
					</div>
					<div className="sm:col-span-2 lg:col-span-1">
						<WidgetSkeleton height={180} />
					</div>

					{/* Visitors vs Page Views */}
					<div className="sm:col-span-2 lg:col-span-3">
						<WidgetSkeleton height={280} />
					</div>

					{/* Audience section section header */}
					<div className="sm:col-span-3 space-y-2 mt-4">
						<Skeleton variant="text" width={200} height={32} />
						<Skeleton variant="text" width={300} height={20} />
					</div>

					{/* Bottom audience widgets */}
					{[1, 2, 3, 4].map((i) => (
						<div className="sm:col-span-3 lg:col-span-1" key={i}>
							<WidgetSkeleton height={220} />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export default Loading;
