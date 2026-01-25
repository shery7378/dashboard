'use client';

import { apiServiceLaravel as api } from '@/store/apiServiceLaravel';

export const addTagTypes = ['Analytics'] as const;

const AnalyticsApi = api
  .enhanceEndpoints({ addTagTypes })
  .injectEndpoints({
    endpoints: (build) => ({
      getSales: build.query<
        { status: number; data: { bucket: string; total_sales: number; orders: number }[] },
        { from?: string; to?: string; interval?: 'day' | 'week' | 'month' }
      >({
        query: ({ from, to, interval = 'day' } = {}) => ({
          url: `/api/analytics/sales`,
          params: { from, to, interval },
        }),
        providesTags: ['Analytics'],
      }),

      getSalesHeatmap: build.query<
        { status: number; data: { store_id: number; latitude: number; longitude: number; total_sales: number; orders: number }[] },
        { from?: string; to?: string }
      >({
        query: ({ from, to } = {}) => ({
          url: `/api/analytics/sales-heatmap`,
		  params: { from, to },
        }),
        providesTags: ['Analytics'],
      }),

      getVendorPerformance: build.query<
        { status: number; data: { vendor_id: number; vendor_name: string; total_sales: number; orders: number; stores_count: number }[] },
		{ from?: string; to?: string; limit?: number }
      >({
        query: ({ from, to, limit = 20 } = {}) => ({
          url: `/api/analytics/vendor-performance`,
		  params: { from, to, limit },
        }),
        providesTags: ['Analytics'],
      }),

      getTopProducts: build.query<
        { status: number; data: { product_id: number; product_name: string; total_sales: number; orders: number }[] },
		{ from?: string; to?: string; limit?: number }
      >({
        query: ({ from, to, limit = 10 } = {}) => ({
          url: `/api/analytics/top-products`,
		  params: { from, to, limit },
        }),
        providesTags: ['Analytics'],
      }),
    }),
    overrideExisting: false,
  });

export default AnalyticsApi;

export const {
  useGetSalesQuery,
  useGetSalesHeatmapQuery,
  useGetVendorPerformanceQuery,
  useGetTopProductsQuery,
} = AnalyticsApi;
