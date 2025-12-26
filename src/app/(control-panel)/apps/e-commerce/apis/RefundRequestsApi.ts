import { apiServiceLaravel as api } from '@/store/apiServiceLaravel';

export const addTagTypes = ['refundRequests'] as const;

export interface RefundRequest {
	id: number;
	user_id: number;
	order_id: number;
	request_number: string;
	reason: string;
	status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'cancelled';
	requested_amount: number;
	refund_type: 'full' | 'partial';
	refund_method?: string;
	admin_notes?: string;
	rejection_reason?: string;
	needs_more_details: boolean;
	admin_question?: string;
	customer_additional_info?: string;
	admin_questioned_at?: string;
	customer_responded_at?: string;
	processed_at?: string;
	processed_by?: number;
	created_at: string;
	updated_at: string;
	has_customer_response?: boolean;
	has_attachments?: boolean;
	attachment_file_ids?: number[];
	attachment_files?: Array<{
		id: number;
		filename: string;
		path: string;
		mime: string;
		size: string;
	}>;
	user?: {
		id: number;
		name: string;
		email: string;
	};
	order?: {
		id: number;
		order_number: string;
		total: number;
	};
	processedBy?: {
		id: number;
		name: string;
	};
}

export type GetRefundRequestsApiResponse = {
	status: number;
	data: RefundRequest[];
	current_page?: number;
	per_page?: number;
	total?: number;
	last_page?: number;
};

export type GetRefundRequestsApiArg = {
	status?: string;
	per_page?: number;
};

export type RequestMoreDetailsApiArg = {
	id: number;
	admin_question: string;
	admin_notes?: string;
};

export type ApproveRefundApiArg = {
	id: number;
	refund_amount?: number;
	admin_notes?: string;
};

export type RejectRefundApiArg = {
	id: number;
	admin_notes: string;
};

const RefundRequestsApi = api
	.enhanceEndpoints({ addTagTypes })
	.injectEndpoints({
		endpoints: (build) => ({
			getRefundRequests: build.query<GetRefundRequestsApiResponse, GetRefundRequestsApiArg>({
				query: (params) => ({
					url: `/api/admin/refunds`,
					params
				}),
				providesTags: ['refundRequests']
			}),

			getRefundRequest: build.query<{ status: number; data: RefundRequest }, number>({
				query: (id) => ({
					url: `/api/admin/refunds/${id}`,
					method: 'GET'
				}),
				providesTags: (result, error, id) => [{ type: 'refundRequests', id }]
			}),

			requestMoreDetails: build.mutation<{ status: number; data: RefundRequest }, RequestMoreDetailsApiArg>({
				query: (body) => ({
					url: `/api/admin/refunds/${body.id}/request-more-details`,
					method: 'POST',
					body: {
						admin_question: body.admin_question,
						admin_notes: body.admin_notes
					}
				}),
				invalidatesTags: ['refundRequests']
			}),

			approveRefund: build.mutation<{ status: number; data: RefundRequest }, ApproveRefundApiArg>({
				query: (body) => ({
					url: `/api/admin/refunds/${body.id}/approve`,
					method: 'POST',
					body: {
						refund_amount: body.refund_amount,
						admin_notes: body.admin_notes
					}
				}),
				invalidatesTags: ['refundRequests']
			}),

			rejectRefund: build.mutation<{ status: number; data: RefundRequest }, RejectRefundApiArg>({
				query: (body) => ({
					url: `/api/admin/refunds/${body.id}/reject`,
					method: 'POST',
					body: {
						admin_notes: body.admin_notes
					}
				}),
				invalidatesTags: ['refundRequests']
			}),
		}),
		overrideExisting: false
	});

export default RefundRequestsApi;

export const {
	useGetRefundRequestsQuery,
	useGetRefundRequestQuery,
	useRequestMoreDetailsMutation,
	useApproveRefundMutation,
	useRejectRefundMutation,
} = RefundRequestsApi;

