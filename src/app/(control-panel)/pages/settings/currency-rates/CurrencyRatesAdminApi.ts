import { apiServiceLaravel as api } from '@/store/apiServiceLaravel';

export const addTagTypes = ['admin_currency_rates'] as const;

const CurrencyRatesAdminApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
	endpoints: (build) => ({
		getAdminCurrencyRates: build.query<GetAdminCurrencyRatesResponse, void>({
			query: () => ({ url: `/api/currencies/rates` }),
			providesTags: ['admin_currency_rates']
		}),
		updateAdminCurrencyRates: build.mutation<UpdateAdminCurrencyRatesResponse, UpdateAdminCurrencyRatesArg>({
			query: (body) => ({
				url: `/api/admin/currencies/rates`,
				method: 'POST',
				body
			}),
			invalidatesTags: ['admin_currency_rates']
		})
	}),
	overrideExisting: false
});

export default CurrencyRatesAdminApi;

export type CurrencyRatesPayload = {
	default_currency: string | null;
	rates: Record<string, number>;
};

export type GetAdminCurrencyRatesResponse = CurrencyRatesPayload;

export type UpdateAdminCurrencyRatesArg = {
	rates: Record<string, number>;
};

export type UpdateAdminCurrencyRatesResponse = CurrencyRatesPayload;

export const { useGetAdminCurrencyRatesQuery, useUpdateAdminCurrencyRatesMutation } = CurrencyRatesAdminApi;
