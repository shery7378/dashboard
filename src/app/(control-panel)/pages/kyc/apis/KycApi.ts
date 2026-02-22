'use client';

import { apiServiceLaravel as api } from '@/store/apiServiceLaravel';

export const addTagTypes = ['Kyc'] as const;

const KycApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
	endpoints: (build) => ({
		getKycStatus: build.query<
			{ status: number; data: { status: 'pending' | 'approved' | 'rejected' | 'not_submitted'; notes?: string } },
			void
		>({
			query: () => ({ url: `/api/kyc/status` }),
			providesTags: ['Kyc']
		}),

		uploadDocument: build.mutation<
			{ status: number; data: { id: number; type: string; filename: string; url: string } },
			{ type: 'id' | 'id_front' | 'id_back' | 'business_license' | 'bank_statement'; file: File }
		>({
			query: ({ type, file }) => {
				const form = new FormData();
				form.append('type', type);
				form.append('file', file);
				return {
					url: `/api/kyc/upload`,
					method: 'POST',
					body: form
				};
			},
			invalidatesTags: ['Kyc']
		}),

		submitKyc: build.mutation<{ status: number; message: string }, { notes?: string }>({
			query: ({ notes } = {}) => {
				// Only include body if notes are provided
				// Don't send empty body - Laravel may reject it
				const query: any = {
					url: `/api/kyc/submit`,
					method: 'POST'
				};

				if (notes) {
					query.body = { notes };
				}

				return query;
			},
			invalidatesTags: ['Kyc']
		}),

		listKycSubmissions: build.query<
			{
				status: number;
				data: { id: number; vendor_id: number; vendor_name: string; status: string; submitted_at: string }[];
			},
			{ status?: 'pending' | 'approved' | 'rejected' }
		>({
			query: ({ status } = {}) => ({
				url: `/api/kyc/submissions`,
				params: { status }
			}),
			providesTags: ['Kyc']
		}),

		approveKyc: build.mutation<{ status: number; message: string }, { submissionId: number }>({
			query: ({ submissionId }) => ({
				url: `/api/kyc/${submissionId}/approve`,
				method: 'POST'
			}),
			invalidatesTags: ['Kyc']
		}),

		rejectKyc: build.mutation<{ status: number; message: string }, { submissionId: number; reason?: string }>({
			query: ({ submissionId, reason }) => ({
				url: `/api/kyc/${submissionId}/reject`,
				method: 'POST',
				body: reason ? { reason } : {}
			}),
			invalidatesTags: ['Kyc']
		}),

		getKycDocuments: build.query<
			{
				status: number;
				data: Partial<
					Record<
						'id_front' | 'id_back' | 'business_license' | 'bank_statement',
						{ filename: string; url: string }
					>
				>;
			},
			{ submissionId: number }
		>({
			query: ({ submissionId }) => ({
				url: `/api/kyc/${submissionId}/documents`
			}),
			providesTags: ['Kyc']
		}),

		startKybInquiry: build.mutation<
			{ status: number; data: { id: string; status: string } },
			{ reference_id: number | string; name?: string; email?: string }
		>({
			query: ({ reference_id, name, email }) => {
				const body: any = { reference_id: String(reference_id) };

				if (name) body.name = name;

				if (email) body.email = email;

				return {
					url: `/api/kyb/inquiries`,
					method: 'POST',
					body
				};
			},
			invalidatesTags: ['Kyc']
		})
	}),
	overrideExisting: false
});

export default KycApi;

export const {
	useGetKycStatusQuery,
	useUploadDocumentMutation,
	useSubmitKycMutation,
	useListKycSubmissionsQuery,
	useApproveKycMutation,
	useRejectKycMutation,
	useGetKycDocumentsQuery,
	useStartKybInquiryMutation
} = KycApi;
