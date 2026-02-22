import { apiServiceLaravel as api } from '@/store/apiServiceLaravel';

export const addTagTypes = ['withdrawals'] as const;

const WithdrawalsApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
	endpoints: (build) => ({
		// Get all withdrawal requests
		getWithdrawals: build.query<GetWithdrawalsApiResponse, GetWithdrawalsApiArg>({
			query: (params) => ({
				url: `/api/admin/withdrawals`,
				params
			}),
			transformResponse: (response: any) => {
				// Ensure admin_wallet is preserved in the response
				return {
					...response,
					admin_wallet: response.admin_wallet || null
				};
			},
			providesTags: ['withdrawals']
		}),

		// Approve withdrawal
		approveWithdrawal: build.mutation<ApproveWithdrawalApiResponse, ApproveWithdrawalApiArg>({
			query: (body) => ({
				url: `/api/admin/withdrawals/${body.id}/approve`,
				method: 'POST'
			}),
			invalidatesTags: ['withdrawals']
		}),

		// Reject withdrawal
		rejectWithdrawal: build.mutation<RejectWithdrawalApiResponse, RejectWithdrawalApiArg>({
			query: (body) => ({
				url: `/api/admin/withdrawals/${body.id}/reject`,
				method: 'POST',
				body: {
					rejection_reason: body.rejection_reason
				}
			}),
			invalidatesTags: ['withdrawals']
		})
	}),
	overrideExisting: false
});

export default WithdrawalsApi;

export const { useGetWithdrawalsQuery, useApproveWithdrawalMutation, useRejectWithdrawalMutation } = WithdrawalsApi;

/** -----------------------------------------------------------------
 * WITHDRAWAL TYPES
 * ----------------------------------------------------------------- */

export type GetWithdrawalsApiResponse = {
	status: number;
	data: WithdrawalRequest[];
	admin_wallet?: {
		balance: number;
		currency: string;
	};
	meta?: {
		current_page: number;
		last_page: number;
		per_page: number;
		total: number;
	};
};

export type GetWithdrawalsApiArg = {
	status?: 'pending' | 'processing' | 'completed' | 'rejected';
	user_id?: number;
	per_page?: number;
};

export type WithdrawalRequest = {
	id: number;
	request_number: string;
	user_id: number;
	user: {
		id: number;
		name: string;
		email: string;
	};
	amount: number;
	currency: string;
	status: 'pending' | 'processing' | 'completed' | 'rejected';
	notes?: string;
	rejection_reason?: string;
	created_at: string;
	processed_at?: string;
	processed_by?: number;
	stripe_payout_id?: string;
	withdrawal_method: string;
	bank_account_id?: number;
};

export type ApproveWithdrawalApiResponse = {
	status: number;
	message: string;
	data: WithdrawalRequest;
	stripe_transfer_id?: string;
	transfer_status?: string;
};

export type ApproveWithdrawalApiArg = {
	id: number;
};

export type RejectWithdrawalApiResponse = {
	status: number;
	message: string;
	data: WithdrawalRequest;
};

export type RejectWithdrawalApiArg = {
	id: number;
	rejection_reason: string;
};
