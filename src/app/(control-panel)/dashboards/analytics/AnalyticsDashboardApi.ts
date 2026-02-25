import { apiService as api } from '@/store/apiService';
import { WithSlice, createSelector } from '@reduxjs/toolkit';
import rootReducer from '@/store/rootReducer';
import AgeWidgetType from './widgets/types/AgeWidgetType';
import ConversionsWidgetType from './widgets/types/ConversionsWidgetType';
import GenderWidgetType from './widgets/types/GenderWidgetType';
import ImpressionsWidgetType from './widgets/types/ImpressionsWidgetType';
import LanguageWidgetType from './widgets/types/LanguageWidgetType';
import NewVsReturningWidgetType from './widgets/types/NewVsReturningWidgetType';
import VisitsWidgetType from './widgets/types/VisitsWidgetType';
import VisitorsVsPageViewsType from './widgets/types/VisitorsVsPageViewsType';

export const addTagTypes = ['analytics_dashboard_widgets'] as const;

const AnalyticsDashboardApi = api
	.enhanceEndpoints({
		addTagTypes
	})
	.injectEndpoints({
		endpoints: (build) => ({
			getAnalyticsDashboardWidgets: build.query<
				GetAnalyticsDashboardWidgetsApiResponse,
				GetAnalyticsDashboardWidgetsApiArg
			>({
				query: () => ({ url: `/api/ga4/dashboard/widgets` }),
				providesTags: ['analytics_dashboard_widgets'],
				keepUnusedDataFor: 3600 // Cache GA4 data for 1 hour in Redux store
			})
		}),
		overrideExisting: false
	});

export default AnalyticsDashboardApi;

export type AnalyticsDashboardWidgetType =
	| AgeWidgetType
	| ConversionsWidgetType
	| GenderWidgetType
	| ImpressionsWidgetType
	| LanguageWidgetType
	| NewVsReturningWidgetType
	| VisitsWidgetType
	| VisitorsVsPageViewsType;

export type GetAnalyticsDashboardWidgetsApiResponse = Record<string, AnalyticsDashboardWidgetType>;
export type GetAnalyticsDashboardWidgetsApiArg = void;

export const { useGetAnalyticsDashboardWidgetsQuery } = AnalyticsDashboardApi;

declare module '@/store/rootReducer' {
	export interface LazyLoadedSlices extends WithSlice<typeof AnalyticsDashboardApi> {}
}

const selectWidgetsData = AnalyticsDashboardApi.endpoints.getAnalyticsDashboardWidgets.select();

// Cache for selector instances to ensure stable references across different files
const selectorCache: Record<string, ReturnType<typeof createSelector>> = {};

export const selectWidget = <T>(id: string) => {
	if (!selectorCache[id]) {
		selectorCache[id] = createSelector([selectWidgetsData], (result) => result?.data?.[id] as T);
	}

	return selectorCache[id];
};

