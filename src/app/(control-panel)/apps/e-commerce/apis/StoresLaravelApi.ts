import { apiServiceLaravel as api } from '@/store/apiServiceLaravel';
import { PartialDeep } from 'type-fest';

// Tags for cache invalidation and auto-refetching
export const addTagTypes = ['eCommerce_stores', 'eCommerce_store'] as const;

// Enhance base API with tag support
const StoresLaravelApi = api
    .enhanceEndpoints({ addTagTypes })
    .injectEndpoints({
        endpoints: (build) => ({
            /** ------------------------------
             *  STORE ENDPOINTS
             * ------------------------------ */

            // Get all stores (paginated)
            getECommerceStores: build.query<GetECommerceStoresApiResponse, GetECommerceStoresApiArg>({
                query: ({ page = 1, perPage = 10 } = {}) => ({
                    url: `/api/stores`,
                    params: { page, per_page: perPage },
                }),
                providesTags: ['eCommerce_stores'],
            }),

            // Get single store by ID
            getECommerceStore: build.query<GetECommerceStoreApiResponse, GetECommerceStoreApiArg>({
                query: (storeId) => ({
                    url: `/api/stores/${storeId}`,
                }),
                providesTags: ['eCommerce_store', 'eCommerce_stores'],
            }),

            // Create a new store
            createECommerceStore: build.mutation<CreateECommerceStoreApiResponse, CreateECommerceStoreApiArg>({
                query: (newStore) => ({
                    url: `/api/stores`,
                    method: 'POST',
                    body: newStore,
                }),
                invalidatesTags: ['eCommerce_stores', 'eCommerce_store'],
            }),

            // Update existing store
            updateECommerceStore: build.mutation<UpdateECommerceStoreApiResponse, UpdateECommerceStoreApiArg>({
                query: (store) => ({
                    url: `/api/stores/${store.id}`,
                    method: 'PUT',
                    body: store,
                }),
                invalidatesTags: ['eCommerce_store', 'eCommerce_stores'],
            }),

            // Delete store by ID
            deleteECommerceStore: build.mutation<DeleteECommerceStoreApiResponse, DeleteECommerceStoreApiArg>({
                query: (storeId) => ({
                    url: `/api/stores/${storeId}`,
                    method: 'DELETE',
                }),
                invalidatesTags: ['eCommerce_store', 'eCommerce_stores'],
            }),
        }),
        overrideExisting: false,
    });

export default StoresLaravelApi;

/** -----------------------------------------------------------------
 * STORE TYPES
 * ----------------------------------------------------------------- */

export type GetECommerceStoresApiResponse = {
    status: number;
    message: string;
    data: EcommerceStore[];
    pagination: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
};
export type GetECommerceStoresApiArg = { page?: number; perPage?: number };

export type GetECommerceStoreApiResponse = {
    status: number;
    message: string;
    data: EcommerceStore;
};
export type GetECommerceStoreApiArg = string;

export type CreateECommerceStoreApiResponse = {
    status: number;
    message: string;
    data: EcommerceStore;
};
export type CreateECommerceStoreApiArg = PartialDeep<EcommerceStore>;

export type UpdateECommerceStoreApiResponse = {
    status: number;
    message: string;
    data: EcommerceStore;
};
export type UpdateECommerceStoreApiArg = PartialDeep<EcommerceStore>;

export type DeleteECommerceStoreApiResponse = {
    status: number;
    message: string;
    data: null;
};
export type DeleteECommerceStoreApiArg = string;

export type EcommerceStore = {
    id: string;
    user_id: string;
    name: string;
    slug: string;
    description: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    address: string | null;
    zip_code: string | null;
    city: string | null;
    country: string | null;
    logo: string | null;
    banner_image: string | null;
    active: boolean;
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string | null;
    latitude: number | null;
    longitude: number | null;
    rating: number | null;
    products_count: number | null;
    offers_pickup: boolean;
    offers_delivery: boolean;
    delivery_radius: number | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    user?: {
        id: string;
        name: string;
        email: string;
    };
};

/** -----------------------------------------------------------------
 * RTK HOOK EXPORTS
 * ----------------------------------------------------------------- */

export const {
    useGetECommerceStoresQuery,
    useGetECommerceStoreQuery,
    useCreateECommerceStoreMutation,
    useUpdateECommerceStoreMutation,
    useDeleteECommerceStoreMutation,
} = StoresLaravelApi;

// Optional: for Redux integration
export type StoresLaravelApiType = {
    [StoresLaravelApi.reducerPath]: ReturnType<typeof StoresLaravelApi.reducer>;
};