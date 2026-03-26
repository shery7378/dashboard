import dynamic from 'next/dynamic';
import Loading from './loading';

const AnalyticsDashboardApp = dynamic(() => import('./AnalyticsDashboardApp'), {
	ssr: true,
	loading: () => <Loading />
});

export default AnalyticsDashboardApp;

