import { apiServiceLaravel as api } from '@/store/apiServiceLaravel';
import { PartialDeep } from 'type-fest';

// Attributes for cache invalidation and auto-refetching
export const addTagTypes = ['eCommerce_attributes', 'eCommerce_attribute'] as const;

// Enhance base API with attribute support
const ECommerceLaravelApi = api
    .enhanceEndpoints({ addTagTypes })
    .injectEndpoints({
        endpoints: (build) => ({

            /** ------------------------------
             *  Attributes ENDPOINTS
             * ------------------------------ */

            // Get all attributes (paginated)
            getECommerceAttributes: build.query<GetECommerceAttributesApiResponse, GetECommerceAttributesApiArg>({
                query: (categoryId?: string) => ({
                    url: categoryId ? `/api/attributes?category_id=${categoryId}` : `/api/attributes`,
                }),
                providesTags: ['eCommerce_attributes'],
            }),


            // Get single attribute by ID
            getECommerceAttribute: build.query<GetECommerceAttributeApiResponse, GetECommerceAttributeApiArg>({
                query: (attributeId) => ({
                    url: `/api/attributes/${attributeId}`
                }),
                providesTags: ['eCommerce_attribute', 'eCommerce_attributes']
            }),

            // Create a new attribute
            createECommerceAttribute: build.mutation<CreateECommerceAttributeApiResponse, CreateECommerceAttributeApiArg>({
                query: (newAttribute) => ({
                    url: `/api/attributes`,
                    method: 'POST',
                    body: newAttribute
                }),
                invalidatesTags: ['eCommerce_attributes', 'eCommerce_attribute']
            }),

            // Update an existing attribute
            updateECommerceAttribute: build.mutation<UpdateECommerceAttributeApiResponse, UpdateECommerceAttributeApiArg>({
                query: (attribute) => ({
                    url: `/api/attributes/${attribute.id}`,
                    method: 'PUT',
                    body: attribute
                }),
                invalidatesTags: ['eCommerce_attribute', 'eCommerce_attributes']
            }),

            // Delete a single attribute
            deleteECommerceAttribute: build.mutation<DeleteECommerceAttributeApiResponse, DeleteECommerceAttributeApiArg>({
                query: (attributeId) => ({
                    url: `/api/attributes/${attributeId}`,
                    method: 'DELETE'
                }),
                invalidatesTags: ['eCommerce_attribute', 'eCommerce_attributes']
            }),

            // Delete multiple attributes
            deleteECommerceAttributes: build.mutation<DeleteECommerceAttributesApiResponse, DeleteECommerceAttributesApiArg>({
                query: (attributeIds) => ({
                    url: `/api/attributes`,
                    method: 'DELETE',
                    body: { ids: attributeIds }
                }),
                invalidatesTags: ['eCommerce_attribute', 'eCommerce_attributes']
            })
        }),
        overrideExisting: false
    });

export default ECommerceLaravelApi;

/** -----------------------------------------------------------------
 * PRODUCT TYPES
 * ----------------------------------------------------------------- */

export type GetECommerceAttributesApiResponse = {
    status: number;
    message: string;
    data: EcommerceAttribute[];
    pagination: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
};
export type GetECommerceAttributesApiArg = string | undefined;

export type GetECommerceAttributeApiResponse = {
    status: number;
    message: string;
    data: EcommerceAttribute;
};
export type GetECommerceAttributeApiArg = string;

export type CreateECommerceAttributeApiResponse = {
    status: number;
    message: string;
    data: EcommerceAttribute;
};
export type CreateECommerceAttributeApiArg = PartialDeep<EcommerceAttribute>;

export type UpdateECommerceAttributeApiResponse = {
    status: number;
    message: string;
    data: EcommerceAttribute;
};
export type UpdateECommerceAttributeApiArg = PartialDeep<EcommerceAttribute>;

export type DeleteECommerceAttributeApiResponse = {
    status: number;
    message: string;
    data: null;
};
export type DeleteECommerceAttributeApiArg = string;

export type DeleteECommerceAttributesApiResponse = {
    status: number;
    message: string;
    data: null;
};
export type DeleteECommerceAttributesApiArg = string[];

export type EcommerceAttribute = {
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
    // Attribute hooks
    useGetECommerceAttributesQuery,
    useGetECommerceAttributeQuery,
    useCreateECommerceAttributeMutation,
    useUpdateECommerceAttributeMutation,
    useDeleteECommerceAttributeMutation,
    useDeleteECommerceAttributesMutation
} = ECommerceLaravelApi;

// Optional: for Redux integration
export type ECommerceLaravelApiType = {
    [ECommerceLaravelApi.reducerPath]: ReturnType<typeof ECommerceLaravelApi.reducer>;
};
