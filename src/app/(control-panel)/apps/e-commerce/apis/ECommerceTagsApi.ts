import { apiServiceLaravel as api } from '@/store/apiServiceLaravel';
import { PartialDeep } from 'type-fest';

// Tags for cache invalidation and auto-refetching
export const addTagTypes = ['eCommerce_tags', 'eCommerce_tag'] as const;

// Enhance base API with tag support
const ECommerceLaravelApi = api
    .enhanceEndpoints({ addTagTypes })
    .injectEndpoints({
        endpoints: (build) => ({

            /** ------------------------------
             *  PRODUCT ENDPOINTS
             * ------------------------------ */

            // Get all tags (paginated)
            getECommerceTags: build.query<GetECommerceTagsApiResponse, GetECommerceTagsApiArg>({
                query: () => ({ url: `/api/tags` }),
                providesTags: ['eCommerce_tags']
            }),

            // Get single tag by ID
            getECommerceTag: build.query<GetECommerceTagApiResponse, GetECommerceTagApiArg>({
                query: (tagId) => ({
                    url: `/api/tags/${tagId}`
                }),
                providesTags: ['eCommerce_tag', 'eCommerce_tags']
            }),

            // Create a new tag
            createECommerceTag: build.mutation<CreateECommerceTagApiResponse, CreateECommerceTagApiArg>({
                query: (newTag) => ({
                    url: `/api/tags`,
                    method: 'POST',
                    body: newTag
                }),
                invalidatesTags: ['eCommerce_tags', 'eCommerce_tag']
            }),

            // Update an existing tag
            updateECommerceTag: build.mutation<UpdateECommerceTagApiResponse, UpdateECommerceTagApiArg>({
                query: (tag) => ({
                    url: `/api/tags/${tag.id}`,
                    method: 'PUT',
                    body: tag
                }),
                invalidatesTags: ['eCommerce_tag', 'eCommerce_tags']
            }),

            // Delete a single tag
            deleteECommerceTag: build.mutation<DeleteECommerceTagApiResponse, DeleteECommerceTagApiArg>({
                query: (tagId) => ({
                    url: `/api/tags/${tagId}`,
                    method: 'DELETE'
                }),
                invalidatesTags: ['eCommerce_tag', 'eCommerce_tags']
            }),

            // Delete multiple tags
            deleteECommerceTags: build.mutation<DeleteECommerceTagsApiResponse, DeleteECommerceTagsApiArg>({
                query: (tagIds) => ({
                    url: `/api/tags`,
                    method: 'DELETE',
                    body: { ids: tagIds }
                }),
                invalidatesTags: ['eCommerce_tag', 'eCommerce_tags']
            })
        }),
        overrideExisting: false
    });

export default ECommerceLaravelApi;

/** -----------------------------------------------------------------
 * PRODUCT TYPES
 * ----------------------------------------------------------------- */

export type GetECommerceTagsApiResponse = {
    status: number;
    message: string;
    data: EcommerceTag[];
    pagination: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
};
export type GetECommerceTagsApiArg = void;

export type GetECommerceTagApiResponse = {
    status: number;
    message: string;
    data: EcommerceTag;
};
export type GetECommerceTagApiArg = string;

export type CreateECommerceTagApiResponse = {
    status: number;
    message: string;
    data: EcommerceTag;
};
export type CreateECommerceTagApiArg = PartialDeep<EcommerceTag>;

export type UpdateECommerceTagApiResponse = {
    status: number;
    message: string;
    data: EcommerceTag;
};
export type UpdateECommerceTagApiArg = PartialDeep<EcommerceTag>;

export type DeleteECommerceTagApiResponse = {
    status: number;
    message: string;
    data: null;
};
export type DeleteECommerceTagApiArg = string;

export type DeleteECommerceTagsApiResponse = {
    status: number;
    message: string;
    data: null;
};
export type DeleteECommerceTagsApiArg = string[];

export type EcommerceTag = {
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
    // Tag hooks
    useGetECommerceTagsQuery,
    useGetECommerceTagQuery,
    useCreateECommerceTagMutation,
    useUpdateECommerceTagMutation,
    useDeleteECommerceTagMutation,
    useDeleteECommerceTagsMutation
} = ECommerceLaravelApi;

// Optional: for Redux integration
export type ECommerceLaravelApiType = {
    [ECommerceLaravelApi.reducerPath]: ReturnType<typeof ECommerceLaravelApi.reducer>;
};
