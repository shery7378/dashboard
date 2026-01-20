import { apiServiceLaravel as api } from '@/store/apiServiceLaravel';

export const addTagTypes = ['admin_product_fees'] as const;

const ProductFeesAdminApi = api
  .enhanceEndpoints({ addTagTypes })
  .injectEndpoints({
    endpoints: (build) => ({
      getAdminProductFeesSettings: build.query<GetAdminProductFeesSettingsResponse, void>({
        query: () => ({ url: `/api/admin/product-fees/settings` }),
        providesTags: ['admin_product_fees'],
      }),
      updateAdminProductFeesSettings: build.mutation<
        UpdateAdminProductFeesSettingsResponse,
        UpdateAdminProductFeesSettingsArg
      >({
        query: (body) => ({
          url: `/api/admin/product-fees/settings`,
          method: 'PUT',
          body,
        }),
        invalidatesTags: ['admin_product_fees'],
      }),
    }),
    overrideExisting: false,
  });

export default ProductFeesAdminApi;

export type ProductFeesSettings = {
  standard_product_fee: number;
  standard_product_fee_type: 'fixed' | 'percentage';
  standard_product_fee_description: string;
  default_currency?: string;
  currency_symbol?: string;
};

export type GetAdminProductFeesSettingsResponse = {
  status: string | number;
  message?: string;
  data: ProductFeesSettings;
};

export type UpdateAdminProductFeesSettingsArg = {
  standard_product_fee: number;
  standard_product_fee_type: 'fixed' | 'percentage';
  standard_product_fee_description?: string;
};

export type UpdateAdminProductFeesSettingsResponse = GetAdminProductFeesSettingsResponse;

export const {
  useGetAdminProductFeesSettingsQuery,
  useUpdateAdminProductFeesSettingsMutation,
} = ProductFeesAdminApi;

