'use client';

import { apiServiceLaravel as api } from '@/store/apiServiceLaravel';

export type Dispute = {
  id: number;
  order_id: number;
  user_id?: number | null;
  type: 'refund' | 'complaint' | string;
  reason: string;
  status: 'open' | 'under_review' | 'approved' | 'rejected' | 'refunded' | 'resolved';
  amount?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

type Paginated<T> = {
  current_page: number;
  data: T[];
  per_page: number;
  total: number;
};

export const addTagTypes = ['Disputes'] as const;

const DisputesApi = api
  .enhanceEndpoints({ addTagTypes })
  .injectEndpoints({
    endpoints: (build) => ({
      getDisputes: build.query<
        { status: number; data: Paginated<Dispute> },
        { status?: string; q?: string; page?: number; per_page?: number }
      >({
        query: ({ status, q, page = 1, per_page = 20 } = {}) => ({
          url: `/api/disputes`,
          params: { status, q, page, per_page },
        }),
        providesTags: ['Disputes'],
      }),

      updateDispute: build.mutation<
        { status: number; data: Dispute },
        { id: number; body: Partial<Pick<Dispute, 'status' | 'type' | 'reason' | 'amount' | 'notes'>> }
      >({
        query: ({ id, body }) => ({
          url: `/api/disputes/${id}`,
          method: 'PUT',
          body,
        }),
        invalidatesTags: ['Disputes'],
      }),
    }),
    overrideExisting: false,
  });

export default DisputesApi;

export const { useGetDisputesQuery, useUpdateDisputeMutation } = DisputesApi;
