'use client';

import FusePageSimple from '@fuse/core/FusePageSimple';
import { Suspense, lazy } from 'react';
import { motion } from 'motion/react';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';
import PageHeader from '@/components/PageHeader';
import { useGetAnalyticsDashboardWidgetsQuery } from './AnalyticsDashboardApi';
import KpiSummary from './KpiSummary';

import VisitorsOverviewWidget from './widgets/VisitorsOverviewWidget';
import ConversionsWidget from './widgets/ConversionsWidget';
import ImpressionsWidget from './widgets/ImpressionsWidget';
import VisitsWidget from './widgets/VisitsWidget';
import VisitorsVsPageViewsWidget from './widgets/VisitorsVsPageViewsWidget';

// Lazy-load audience widgets which are below the fold
const NewVsReturningWidget = lazy(() => import('./widgets/NewVsReturningWidget'));
const AgeWidget = lazy(() => import('./widgets/AgeWidget'));
const LanguageWidget = lazy(() => import('./widgets/LanguageWidget'));
const GenderWidget = lazy(() => import('./widgets/GenderWidget'));


const container = {
	show: {
		transition: {
			staggerChildren: 0.02
		}
	}
};

const item = {
	hidden: { opacity: 0, y: 20 },
	show: { opacity: 1, y: 0, transition: { duration: 0.25 } }
};

/** Skeleton shown while a widget is loading */
function WidgetSkeleton({ height = 200 }: { height?: number }) {
	return (
		<Skeleton
			variant="rounded"
			height={height}
			sx={{ borderRadius: 3 }}
		/>
	);
}

/**
 * The analytics dashboard app.
 * Widgets are lazy-loaded so the page header and KPI bar appear instantly.
 * Heavy GA4 widgets stream in as their data resolves.
 */
function AnalyticsDashboardApp() {
	// Fire the single GA4 fetch; RTK Query handles caching (1 hour TTL)
	const { isLoading } = useGetAnalyticsDashboardWidgetsQuery();

	return (
		<FusePageSimple
			header={
				<PageHeader 
					title="Analytics Dashboard" 
					subtitle="Monitor metrics, check reports and review performance"
					actions={[
						{
							label: 'Settings',
							icon: 'heroicons-solid:cog-6-tooth',
							color: 'primary'
						},
						{
							label: 'Export',
							icon: 'heroicons-solid:arrow-up-tray',
							color: 'secondary'
						}
					]}
				/>
			}
			content={
				<motion.div
					className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full p-6 md:p-8"
					variants={container}
					initial="hidden"
					animate="show"
				>
					{/* KPI Summary – shows skeletons while data is loading */}
					<motion.div
						variants={item}
						className="sm:col-span-2 lg:col-span-3"
					>
						<KpiSummary isLoading={isLoading} />
					</motion.div>


					{/* Visitors Overview */}
					<motion.div
						variants={item}
						className="sm:col-span-2 lg:col-span-3"
					>
						<VisitorsOverviewWidget />
					</motion.div>

					{/* Three compact trend cards */}
					<motion.div
						variants={item}
						className="sm:col-span-2 lg:col-span-1"
					>
						<ConversionsWidget />
					</motion.div>

					<motion.div
						variants={item}
						className="sm:col-span-2 lg:col-span-1"
					>
						<ImpressionsWidget />
					</motion.div>

					<motion.div
						variants={item}
						className="sm:col-span-2 lg:col-span-1"
					>
						<VisitsWidget />
					</motion.div>

					{/* Visitors vs Page Views */}
					<motion.div
						variants={item}
						className="sm:col-span-2 lg:col-span-3"
					>
						<VisitorsVsPageViewsWidget />
					</motion.div>


					{/* Audience section */}
					<Box className="w-full mt-4 sm:col-span-3">
						<Typography className="text-2xl font-semibold tracking-tight leading-6">
							Your Audience
						</Typography>
						<Typography
							className="font-medium tracking-tight"
							color="text.secondary"
						>
							Demographic properties of your users
						</Typography>
					</Box>

					<div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
						<Suspense fallback={<WidgetSkeleton height={220} />}>
							<NewVsReturningWidget />
						</Suspense>
						<Suspense fallback={<WidgetSkeleton height={220} />}>
							<GenderWidget />
						</Suspense>
						<Suspense fallback={<WidgetSkeleton height={220} />}>
							<AgeWidget />
						</Suspense>
						<Suspense fallback={<WidgetSkeleton height={220} />}>
							<LanguageWidget />
						</Suspense>
					</div>
				</motion.div>
			}
		/>
	);
}

export default AnalyticsDashboardApp;
