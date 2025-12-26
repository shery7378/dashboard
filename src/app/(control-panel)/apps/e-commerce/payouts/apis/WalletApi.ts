import { apiServiceLaravel as api } from '@/store/apiServiceLaravel';
import { PartialDeep } from 'type-fest';

// Tags for cache invalidation and auto-refetching
export const addTagTypes = ['wallet', 'wallet_transaction'] as const;

// Enhance base API with wallet support
const WalletApi = api
	.enhanceEndpoints({ addTagTypes })
	.injectEndpoints({
		endpoints: (build) => ({
			// Get wallet data
			getWallet: build.query<GetWalletApiResponse, void>({
				query: () => ({ url: `/api/wallet` }),
				providesTags: ['wallet']
			}),

			// Get wallet transactions
			getWalletTransactions: build.query<GetWalletTransactionsApiResponse, GetWalletTransactionsApiArg>({
				query: (params) => ({
					url: `/api/wallet/transactions`,
					params
				}),
				providesTags: ['wallet_transaction']
			}),

			// Get wallet statistics
			getWalletStatistics: build.query<GetWalletStatisticsApiResponse, void>({
				query: () => ({ url: `/api/wallet/statistics` }),
				providesTags: ['wallet']
			}),

			// Request payout
			requestPayout: build.mutation<RequestPayoutApiResponse, RequestPayoutApiArg>({
				query: (body) => ({
					url: `/api/wallet/payout`,
					method: 'POST',
					body
				}),
				invalidatesTags: ['wallet', 'wallet_transaction']
			}),

			// Create Stripe Connect account
			createStripeAccount: build.mutation<CreateStripeAccountApiResponse, CreateStripeAccountApiArg>({
				query: (body) => ({
					url: `/api/stripe-connect/create-account`,
					method: 'POST',
					body
				}),
				invalidatesTags: ['wallet']
			}),

			// Get Stripe Connect account
			getStripeAccount: build.query<GetStripeAccountApiResponse, void>({
				query: () => ({ url: `/api/stripe-connect/account` }),
				providesTags: ['wallet']
			}),
		}),
		overrideExisting: false
	});

export default WalletApi;

/** -----------------------------------------------------------------
 * WALLET TYPES
 * ----------------------------------------------------------------- */

export type GetWalletApiResponse = {
	wallet: {
		id: number;
		user_id: number;
		store_id: number | null;
		balance: number;
		pending_balance: number;
		total_earned: number;
		total_paid_out: number;
		currency: string;
		is_active: boolean;
	};
	available_balance: number;
	recent_transactions: WalletTransaction[];
	stripe_account: StripeConnectAccount | null;
	is_stripe_connected: boolean;
};

export type WalletTransaction = {
	id: number;
	user_id: number;
	wallet_id: number;
	order_id: number | null;
	type: 'credit' | 'debit' | 'payout' | 'refund' | 'adjustment';
	status: 'pending' | 'completed' | 'failed' | 'cancelled';
	amount: number;
	balance_before: number;
	balance_after: number;
	currency: string;
	description: string | null;
	reference_id: string | null;
	transaction_id: string | null;
	metadata: any;
	processed_at: string | null;
	created_at: string;
	updated_at: string;
};

export type StripeConnectAccount = {
	id: number;
	user_id: number;
	store_id: number | null;
	account_id: string;
	onboarding_link: string | null;
	status: 'pending' | 'incomplete' | 'active' | 'restricted' | 'rejected';
	charges_enabled: boolean;
	payouts_enabled: boolean;
	capabilities: any;
	requirements: any;
	details_submitted: string | null;
	created_at: string;
	updated_at: string;
};

export type GetWalletTransactionsApiResponse = {
	data: WalletTransaction[];
	current_page: number;
	last_page: number;
	per_page: number;
	total: number;
};

export type GetWalletTransactionsApiArg = {
	per_page?: number;
	page?: number;
	type?: string;
	status?: string;
	start_date?: string;
	end_date?: string;
};

export type GetWalletStatisticsApiResponse = {
	today_earnings: number;
	month_earnings: number;
	last_month_earnings: number;
	month_payouts: number;
	total_transactions: number;
	pending_transactions: number;
};

export type RequestPayoutApiResponse = {
	message: string;
	transaction: WalletTransaction;
	wallet: any;
};

export type RequestPayoutApiArg = {
	amount: number;
};

export type CreateStripeAccountApiArg = {
	email: string;
};

export type CreateStripeAccountApiResponse = {
	message: string;
	onboarding_url?: string;
	account?: StripeConnectAccount;
	is_connected: boolean;
};

export type GetStripeAccountApiResponse = {
	account: StripeConnectAccount;
	is_connected: boolean;
	status: string;
};

/** -----------------------------------------------------------------
 * RTK HOOK EXPORTS
 * ----------------------------------------------------------------- */

export const {
	useGetWalletQuery,
	useGetWalletTransactionsQuery,
	useGetWalletStatisticsQuery,
	useRequestPayoutMutation,
	useCreateStripeAccountMutation,
	useGetStripeAccountQuery
} = WalletApi;

