import { apiServiceLaravel as api } from '@/store/apiServiceLaravel';
import { PartialDeep } from 'type-fest';

// Colors for cache invalidation and auto-refetching
export const addTagTypes = ['eCommerce_colors', 'eCommerce_color'] as const;

// Enhance base API with color support
const ECommerceLaravelApi = api
    .enhanceEndpoints({ addTagTypes })
    .injectEndpoints({
        endpoints: (build) => ({

            /** ------------------------------
             *  Colors ENDPOINTS
             * ------------------------------ */

            // Get all colors (paginated)
            getECommerceColors: build.query<GetECommerceColorsApiResponse, GetECommerceColorsApiArg>({
                query: () => ({ url: `/api/colors` }),
                providesTags: ['eCommerce_colors']
            }),

            // Get single color by ID
            getECommerceColor: build.query<GetECommerceColorApiResponse, GetECommerceColorApiArg>({
                query: (colorId) => ({
                    url: `/api/colors/${colorId}`
                }),
                providesTags: ['eCommerce_color', 'eCommerce_colors']
            }),

            // Create a new color
            createECommerceColor: build.mutation<CreateECommerceColorApiResponse, CreateECommerceColorApiArg>({
                query: (newColor) => ({
                    url: `/api/colors`,
                    method: 'POST',
                    body: newColor
                }),
                invalidatesTags: ['eCommerce_colors', 'eCommerce_color']
            }),

            // Update an existing color
            updateECommerceColor: build.mutation<UpdateECommerceColorApiResponse, UpdateECommerceColorApiArg>({
                query: (color) => ({
                    url: `/api/colors/${color.id}`,
                    method: 'PUT',
                    body: color
                }),
                invalidatesTags: ['eCommerce_color', 'eCommerce_colors']
            }),

            // Delete a single color
            deleteECommerceColor: build.mutation<DeleteECommerceColorApiResponse, DeleteECommerceColorApiArg>({
                query: (colorId) => ({
                    url: `/api/colors/${colorId}`,
                    method: 'DELETE'
                }),
                invalidatesTags: ['eCommerce_color', 'eCommerce_colors']
            }),

            // Delete multiple colors
            deleteECommerceColors: build.mutation<DeleteECommerceColorsApiResponse, DeleteECommerceColorsApiArg>({
                query: (colorIds) => ({
                    url: `/api/colors`,
                    method: 'DELETE',
                    body: { ids: colorIds }
                }),
                invalidatesTags: ['eCommerce_color', 'eCommerce_colors']
            })
        }),
        overrideExisting: false
    });

export default ECommerceLaravelApi;

/** -----------------------------------------------------------------
 * PRODUCT TYPES
 * ----------------------------------------------------------------- */

export type GetECommerceColorsApiResponse = {
    status: number;
    message: string;
    data: EcommerceColor[];
    pagination: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
};
export type GetECommerceColorsApiArg = void;

export type GetECommerceColorApiResponse = {
    status: number;
    message: string;
    data: EcommerceColor;
};
export type GetECommerceColorApiArg = string;

export type CreateECommerceColorApiResponse = {
    status: number;
    message: string;
    data: EcommerceColor;
};
export type CreateECommerceColorApiArg = PartialDeep<EcommerceColor>;

export type UpdateECommerceColorApiResponse = {
    status: number;
    message: string;
    data: EcommerceColor;
};
export type UpdateECommerceColorApiArg = PartialDeep<EcommerceColor>;

export type DeleteECommerceColorApiResponse = {
    status: number;
    message: string;
    data: null;
};
export type DeleteECommerceColorApiArg = string;

export type DeleteECommerceColorsApiResponse = {
    status: number;
    message: string;
    data: null;
};
export type DeleteECommerceColorsApiArg = string[];

export type EcommerceColor = {
    id: string;
    store_id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    sale_price: number | null;
    sku: string | null;
    stock_quantity: number;
    gallery_images: string[] | null;
    featured_image_id: string | null;
    gallery: string[] | null;
    featured_image: string[] | null;
    category_ids: string[] | null;
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
};

/** -----------------------------------------------------------------
 * RTK HOOK EXPORTS
 * ----------------------------------------------------------------- */

export const {
    // Color hooks
    useGetECommerceColorsQuery,
    useGetECommerceColorQuery,
    useCreateECommerceColorMutation,
    useUpdateECommerceColorMutation,
    useDeleteECommerceColorMutation,
    useDeleteECommerceColorsMutation
} = ECommerceLaravelApi;

// Optional: for Redux integration
export type ECommerceLaravelApiType = {
    [ECommerceLaravelApi.reducerPath]: ReturnType<typeof ECommerceLaravelApi.reducer>;
};
