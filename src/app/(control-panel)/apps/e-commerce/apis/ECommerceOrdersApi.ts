//src/app/(control-panel)/apps/e-commerce/apis/ECommerceOrdersApi.ts
import { apiServiceLaravel as api } from '@/store/apiServiceLaravel';
import { PartialDeep } from 'type-fest';

// Tags for cache invalidation and auto-refetching
export const addTagTypes = ['eCommerce_orders', 'eCommerce_order'] as const;

// Enhance base API with order support
const ECommerceLaravelApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
	endpoints: (build) => ({
		/** ------------------------------
		 *  Orders ENDPOINTS
		 * ------------------------------ */

		// Get all orders (paginated)
		getECommerceOrders: build.query<GetECommerceOrdersApiResponse, GetECommerceOrdersApiArg>({
			query: ({ page = 1, perPage = 10 } = {}) => ({
				url: `/api/orders`,
				params: { page, per_page: perPage }
			}),
			providesTags: ['eCommerce_orders'],
			keepUnusedDataFor: 300 // Keep data for 5 minutes after unmount
		}),

		// Get single order by ID
		getECommerceOrder: build.query<GetECommerceOrderApiResponse, GetECommerceOrderApiArg>({
			query: (orderId) => ({
				url: `/api/orders/${orderId}`
			}),
			providesTags: ['eCommerce_order', 'eCommerce_orders']
		}),

		// Create a new order
		createECommerceOrder: build.mutation<CreateECommerceOrderApiResponse, CreateECommerceOrderApiArg>({
			query: (newOrder) => ({
				url: `/api/orders`,
				method: 'POST',
				body: newOrder
			}),
			invalidatesTags: ['eCommerce_orders', 'eCommerce_order']
		}),

		// Update an existing order
		updateECommerceOrder: build.mutation<UpdateECommerceOrderApiResponse, UpdateECommerceOrderApiArg>({
			query: (order) => ({
				url: `/api/orders/${order.id}`,
				method: 'PUT',
				body: order
			}),
			invalidatesTags: ['eCommerce_order', 'eCommerce_orders']
		}),

		// Update only the shipping status of an order
		updateECommerceShippingStatus: build.mutation<
			UpdateECommerceOrderApiResponse,
			{ id: string; shipping_status: string }
		>({
			query: ({ id, shipping_status }) => ({
				url: `/api/orders/order-shipping-status-update`,
				method: 'PUT',
				body: { id, shipping_status }
			}),
			invalidatesTags: ['eCommerce_order', 'eCommerce_orders']
		}),

		// Update only the shipping status of an order
		updateECommerceProductShippingStatus: build.mutation<
			UpdateECommerceOrderApiResponse,
			{ id: string; shipping_status: string }
		>({
			query: ({ id, shipping_status }) => ({
				url: `/api/orders/product-shipping-status-update`,
				method: 'PUT',
				body: { id, shipping_status }
			}),
			invalidatesTags: ['eCommerce_order', 'eCommerce_orders']
		}),

		// Delete a single order
		deleteECommerceOrder: build.mutation<DeleteECommerceOrderApiResponse, DeleteECommerceOrderApiArg>({
			query: (orderId) => ({
				url: `/api/orders/${orderId}`,
				method: 'DELETE'
			}),
			invalidatesTags: ['eCommerce_order', 'eCommerce_orders']
		}),

		// Delete multiple orders
		deleteECommerceOrders: build.mutation<DeleteECommerceOrdersApiResponse, DeleteECommerceOrdersApiArg>({
			query: (orderIds) => ({
				url: `/api/orders`,
				method: 'DELETE',
				body: { ids: orderIds }
			}),
			invalidatesTags: ['eCommerce_order', 'eCommerce_orders']
		})
	}),
	overrideExisting: false
});

export default ECommerceLaravelApi;

/** -----------------------------------------------------------------
 * ORDER TYPES
 * ----------------------------------------------------------------- */

export type GetECommerceOrdersApiResponse = {
	status: number;
	message: string;
	data: EcommerceOrder[];
	pagination: {
		total: number;
		per_page: number;
		current_page: number;
		last_page: number;
	};
};
export type GetECommerceOrdersApiArg = { page?: number; perPage?: number } | void;

export type GetECommerceOrderApiResponse = {
	status: number;
	message: string;
	data: EcommerceOrder;
};
export type GetECommerceOrderApiArg = string;

export type CreateECommerceOrderApiResponse = {
	status: number;
	message: string;
	data: EcommerceOrder;
};
export type CreateECommerceOrderApiArg = PartialDeep<EcommerceOrder>;

export type UpdateECommerceOrderApiResponse = {
	status: number;
	message: string;
	data: EcommerceOrder;
};
export type UpdateECommerceOrderApiArg = PartialDeep<EcommerceOrder>;

export type DeleteECommerceOrderApiResponse = {
	status: number;
	message: string;
	data: null;
};
export type DeleteECommerceOrderApiArg = string;

export type DeleteECommerceOrdersApiResponse = {
	status: number;
	message: string;
	data: null;
};
export type DeleteECommerceOrdersApiArg = string[];

export type EcommerceOrder = {
	id: string;
	store_id: string;
	customer_id: string;
	order_number: string;
	user?: {
		id: number;
		name: string;
		email: string;
		[key: string]: unknown; // in case more fields come
	} | null;
	product_detail?:
		| {
				product_detail?: Record<string, unknown>;
				[key: string]: unknown;
		  }[]
		| null;
	status: string; // e.g., 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
	total_amount: number;
	shipping_amount: number | null;
	tax_amount: number | null;
	price: string | null;
	payment_method: string | null;
	payment_status: string | null; // e.g., 'paid', 'pending', 'failed'
	shipping_address: string | null;
	shipping_status: string | null;
	billing_address: string | null;
	items:
		| {
				product_id: string;
				quantity: number;
				unit_price: number;
				subtotal: number;
		  }[]
		| null;
	notes: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
};

/** -----------------------------------------------------------------
 * RTK HOOK EXPORTS
 * ----------------------------------------------------------------- */

export const {
	// Order hooks
	useGetECommerceOrdersQuery,
	useGetECommerceOrderQuery,
	useCreateECommerceOrderMutation,
	useUpdateECommerceOrderMutation,
	useUpdateECommerceShippingStatusMutation,
	useUpdateECommerceProductShippingStatusMutation,
	useDeleteECommerceOrderMutation,
	useDeleteECommerceOrdersMutation
} = ECommerceLaravelApi;

// Optional: for Redux integration
export type ECommerceLaravelApiType = {
	[ECommerceLaravelApi.reducerPath]: ReturnType<typeof ECommerceLaravelApi.reducer>;
};
