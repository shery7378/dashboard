import { combineSlices } from '@reduxjs/toolkit';
import apiService from './apiService';
import { navigationSlice } from '@/components/theme-layouts/components/navigation/store/navigationSlice';
import apiServiceLaravel from './apiServiceLaravel';
// import ECommerceLaravelApi from '@/app/(control-panel)/apps/e-commerce/ECommerceLaravelApi';
import ProfileLaravelApi from '@/app/(control-panel)/(user)/accounts/apis/ProfileApi';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export interface LazyLoadedSlices { }

// `combineSlices` automatically combines the reducers using
// their `reducerPath`s, therefore we no longer need to call `combineReducers`.
export const rootReducer = combineSlices(
	/**
	 * Static slices
	 */
	navigationSlice,
	/**
	 * Lazy loaded slices
	 */
	{
		[apiService.reducerPath]: apiService.reducer,
		[apiServiceLaravel.reducerPath]: apiServiceLaravel.reducer,
		// [ECommerceLaravelApi.reducerPath]: ECommerceLaravelApi.reducer,
		[ProfileLaravelApi.reducerPath]: ProfileLaravelApi.reducer,
	}
).withLazyLoadedSlices<LazyLoadedSlices>();

export default rootReducer;
