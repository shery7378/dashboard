import { Action, ThunkAction, configureStore, createSelector } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import apiService from '@/store/apiService';
import apiServiceLaravel from '@/store/apiServiceLaravel';
// import ECommerceLaravelApi from '@/app/(control-panel)/apps/e-commerce/ECommerceLaravelApi';
import rootReducer from './rootReducer';
import { dynamicMiddleware } from './middleware';
// import ProfileLaravelApi from '@/app/(control-panel)/(user)/account/apis/ProfileApi';

export type RootState = ReturnType<typeof rootReducer>;

export const makeStore = (preloadedState?: Partial<RootState>) => {
	const middlewareArray = [
		apiService.middleware,
		apiServiceLaravel.middleware,
		// ECommerceLaravelApi.middleware,
		// ProfileLaravelApi.middleware,
		dynamicMiddleware
	];

	console.log(
		'Middleware signatures:',
		middlewareArray.map((m) => m.toString())
	);

	const store = configureStore({
		reducer: rootReducer,
		middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }).concat(middlewareArray)
	});

	setupListeners(store.dispatch);
	return store;
};

export const store = makeStore();

export type AppStore = typeof store;
export type AppDispatch = AppStore['dispatch'];
export type AppThunk<ThunkReturnType = void> = ThunkAction<ThunkReturnType, RootState, unknown, Action>;
export type AppAction<R = Promise<void>> = Action<string> | ThunkAction<R, RootState, unknown, Action<string>>;

export const createAppSelector = createSelector.withTypes<RootState>();

export default store;
