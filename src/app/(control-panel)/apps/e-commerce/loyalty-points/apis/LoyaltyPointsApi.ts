import { apiServiceLaravel as api } from '@/store/apiServiceLaravel';

export const addTagTypes = ['loyalty-points', 'loyalty-points-settings'] as const;

const LoyaltyPointsApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
	endpoints: (build) => ({
		// Get all loyalty points transactions
		getLoyaltyPoints: build.query<GetLoyaltyPointsApiResponse, GetLoyaltyPointsApiArg>({
			query: (params) => ({
				url: `/api/admin/loyalty-points`,
				params
			}),
			providesTags: ['loyalty-points']
		}),

		// Get user's loyalty points history
		getUserLoyaltyPointsHistory: build.query<
			GetUserLoyaltyPointsHistoryApiResponse,
			GetUserLoyaltyPointsHistoryApiArg
		>({
			query: (userId) => ({
				url: `/api/admin/loyalty-points/user/${userId}/history`
			}),
			providesTags: ['loyalty-points']
		}),

		// Adjust user points
		adjustUserPoints: build.mutation<AdjustUserPointsApiResponse, AdjustUserPointsApiArg>({
			query: (body) => ({
				url: `/api/admin/loyalty-points/user/${body.userId}/adjust`,
				method: 'POST',
				body: {
					points: body.points,
					description: body.description
				}
			}),
			invalidatesTags: ['loyalty-points']
		}),

		// Award points for order
		awardPointsForOrder: build.mutation<AwardPointsForOrderApiResponse, AwardPointsForOrderApiArg>({
			query: (orderId) => ({
				url: `/api/admin/loyalty-points/order/${orderId}/award`,
				method: 'POST'
			}),
			invalidatesTags: ['loyalty-points']
		}),

		// Get loyalty points settings
		getLoyaltyPointsSettings: build.query<GetLoyaltyPointsSettingsApiResponse, void>({
			query: () => ({
				url: `/api/admin/loyalty-points/settings`
			}),
			providesTags: ['loyalty-points-settings']
		}),

		// Update loyalty points settings
		updateLoyaltyPointsSettings: build.mutation<
			UpdateLoyaltyPointsSettingsApiResponse,
			UpdateLoyaltyPointsSettingsApiArg
		>({
			query: (body) => ({
				url: `/api/admin/loyalty-points/settings`,
				method: 'PUT',
				body
			}),
			invalidatesTags: ['loyalty-points-settings', 'loyalty-points']
		})
	}),
	overrideExisting: false
});

export default LoyaltyPointsApi;

export const {
	useGetLoyaltyPointsQuery,
	useGetUserLoyaltyPointsHistoryQuery,
	useAdjustUserPointsMutation,
	useAwardPointsForOrderMutation,
	useGetLoyaltyPointsSettingsQuery,
	useUpdateLoyaltyPointsSettingsMutation
} = LoyaltyPointsApi;

/** -----------------------------------------------------------------
 * LOYALTY POINTS TYPES
 * ----------------------------------------------------------------- */

export type GetLoyaltyPointsApiResponse = {
	status: string;
	data: {
		loyaltyPoints: {
			data: LoyaltyPoint[];
			current_page: number;
			last_page: number;
			per_page: number;
			total: number;
		};
		stats: {
			total_earned: number;
			total_redeemed: number;
			total_expired: number;
			total_adjusted: number;
			current_balance: number;
		};
		users: {
			id: number;
			first_name: string;
			last_name: string;
			email: string;
			loyalty_points_balance: number;
		}[];
	};
};

export type GetLoyaltyPointsApiArg = {
	user_id?: number;
	type?: 'earned' | 'redeemed' | 'expired' | 'adjusted';
	date_from?: string;
	date_to?: string;
};

export type GetUserLoyaltyPointsHistoryApiResponse = {
	status: string;
	data: {
		user: {
			id: number;
			first_name: string;
			last_name: string;
			email: string;
			loyalty_points_balance: number;
		};
		loyaltyPoints: {
			data: LoyaltyPoint[];
			current_page: number;
			last_page: number;
			per_page: number;
			total: number;
		};
	};
};

export type GetUserLoyaltyPointsHistoryApiArg = number;

export type AdjustUserPointsApiResponse = {
	status: string;
	message: string;
};

export type AdjustUserPointsApiArg = {
	userId: number;
	points: number;
	description: string;
};

export type AwardPointsForOrderApiResponse = {
	status: string;
	message: string;
	data: LoyaltyPoint;
};

export type AwardPointsForOrderApiArg = number;

export type GetLoyaltyPointsSettingsApiResponse = {
	status: string;
	data: {
		loyalty_points_enabled: boolean;
		loyalty_points_per_dollar: number;
		loyalty_points_dollar_per_point: number;
		loyalty_points_min_redemption: number;
		loyalty_points_expiration_days: number | null;
		default_currency?: string;
		currency_symbol?: string;
	};
};

export type UpdateLoyaltyPointsSettingsApiResponse = {
	status: string;
	message: string;
	data: {
		loyalty_points_enabled: boolean;
		loyalty_points_per_dollar: number;
		loyalty_points_dollar_per_point: number;
		loyalty_points_min_redemption: number;
		loyalty_points_expiration_days: number | null;
	};
};

export type UpdateLoyaltyPointsSettingsApiArg = {
	loyalty_points_enabled: boolean;
	loyalty_points_per_dollar: number;
	loyalty_points_dollar_per_point: number;
	loyalty_points_min_redemption: number;
	loyalty_points_expiration_days: number | null;
};

export type LoyaltyPoint = {
	id: number;
	user_id: number;
	order_id: number | null;
	type: 'earned' | 'redeemed' | 'expired' | 'adjusted';
	points: number;
	description: string;
	balance_after: number;
	expires_at: string | null;
	created_at: string;
	updated_at: string;
	user?: {
		id: number;
		first_name: string;
		last_name: string;
		email: string;
	};
	order?: {
		id: number;
		order_number?: string;
	};
};
