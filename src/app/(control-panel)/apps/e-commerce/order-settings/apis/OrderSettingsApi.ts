import { apiServiceLaravel as api } from '@/store/apiServiceLaravel';

// Tags for cache invalidation
export const addTagTypes = ['order_settings'] as const;

// Enhance base API with order settings support
const OrderSettingsApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
	endpoints: (build) => ({
		// Get order settings
		getOrderSettings: build.query<GetOrderSettingsApiResponse, GetOrderSettingsApiArg>({
			query: (params) => ({
				url: `/api/vendor/order-settings`,
				params
			}),
			providesTags: ['order_settings']
		}),

		// Update order settings
		updateOrderSettings: build.mutation<UpdateOrderSettingsApiResponse, UpdateOrderSettingsApiArg>({
			query: (body) => ({
				url: `/api/vendor/order-settings`,
				method: 'PUT',
				body
			}),
			invalidatesTags: ['order_settings']
		}),

		// Reset order settings to defaults
		resetOrderSettings: build.mutation<ResetOrderSettingsApiResponse, ResetOrderSettingsApiArg>({
			query: (body) => ({
				url: `/api/vendor/order-settings/reset`,
				method: 'POST',
				body
			}),
			invalidatesTags: ['order_settings']
		})
	}),
	overrideExisting: false
});

export default OrderSettingsApi;

/** -----------------------------------------------------------------
 * ORDER SETTINGS TYPES
 * ----------------------------------------------------------------- */

export type VendorOrderSetting = {
	id: number;
	user_id: number;
	store_id: number | null;
	auto_fulfill_orders: boolean;
	auto_fulfill_delay_minutes: number;
	notify_on_new_order: boolean;
	notify_on_order_update: boolean;
	notify_on_payment_received: boolean;
	default_shipping_method: string | null;
	default_shipping_cost: number | null;
	processing_time_days: number;
	auto_update_to_processing: boolean;
	auto_processing_delay_hours: number;
	auto_update_to_ready: boolean;
	auto_ready_delay_hours: number;
	allow_order_cancellation: boolean;
	cancellation_time_limit_hours: number;
	require_order_confirmation: boolean;
	auto_accept_orders: boolean;
	additional_settings: any;
	created_at: string;
	updated_at: string;
};

export type GetOrderSettingsApiResponse = {
	status: number;
	data: VendorOrderSetting;
};

export type GetOrderSettingsApiArg = {
	store_id?: number;
};

export type UpdateOrderSettingsApiResponse = {
	status: number;
	message: string;
	data: VendorOrderSetting;
};

export type UpdateOrderSettingsApiArg = {
	store_id?: number;
	auto_fulfill_orders?: boolean;
	auto_fulfill_delay_minutes?: number;
	notify_on_new_order?: boolean;
	notify_on_order_update?: boolean;
	notify_on_payment_received?: boolean;
	default_shipping_method?: string | null;
	default_shipping_cost?: number | null;
	processing_time_days?: number;
	auto_update_to_processing?: boolean;
	auto_processing_delay_hours?: number;
	auto_update_to_ready?: boolean;
	auto_ready_delay_hours?: number;
	allow_order_cancellation?: boolean;
	cancellation_time_limit_hours?: number;
	require_order_confirmation?: boolean;
	auto_accept_orders?: boolean;
	additional_settings?: any;
};

export type ResetOrderSettingsApiResponse = {
	status: number;
	message: string;
	data: VendorOrderSetting;
};

export type ResetOrderSettingsApiArg = {
	store_id?: number;
};

/** -----------------------------------------------------------------
 * RTK HOOK EXPORTS
 * ----------------------------------------------------------------- */

export const { useGetOrderSettingsQuery, useUpdateOrderSettingsMutation, useResetOrderSettingsMutation } =
	OrderSettingsApi;
