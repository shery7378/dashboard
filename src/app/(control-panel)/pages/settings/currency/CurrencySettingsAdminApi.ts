import { apiServiceLaravel as api } from '@/store/apiServiceLaravel';

export const addTagTypes = ['admin_currency_settings'] as const;

const CurrencySettingsAdminApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
	endpoints: (build) => ({
		getAdminCurrencySettings: build.query<GetAdminCurrencySettingsResponse, void>({
			query: () => ({ url: `/api/admin/currency-settings` }),
			providesTags: ['admin_currency_settings']
		}),
		updateAdminCurrencySettings: build.mutation<
			UpdateAdminCurrencySettingsResponse,
			UpdateAdminCurrencySettingsArg
		>({
			query: (body) => ({
				url: `/api/admin/currency-settings`,
				method: 'PUT',
				body
			}),
			invalidatesTags: ['admin_currency_settings']
		})
	}),
	overrideExisting: false
});

export default CurrencySettingsAdminApi;

export type CurrencySettings = {
	supported_currencies: string[];
	default_currency: string | null;
};

export type GetAdminCurrencySettingsResponse = {
	status: number;
	message: string;
	data: CurrencySettings;
};

export type UpdateAdminCurrencySettingsArg = {
	supported_currencies: string[];
	default_currency: string;
};

export type UpdateAdminCurrencySettingsResponse = GetAdminCurrencySettingsResponse;

export const { useGetAdminCurrencySettingsQuery, useUpdateAdminCurrencySettingsMutation } = CurrencySettingsAdminApi;
