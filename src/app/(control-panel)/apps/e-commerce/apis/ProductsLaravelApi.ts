import { apiServiceLaravel as api } from '@/store/apiServiceLaravel';
import { PartialDeep } from 'type-fest';

// Tags for cache invalidation and auto-refetching
export const addTagTypes = ['eCommerce_products', 'eCommerce_product'] as const;

// Enhance base API with tag support
const ProductsLaravelApi = api
    .enhanceEndpoints({ addTagTypes })
    .injectEndpoints({
        endpoints: (build) => ({
            /** ------------------------------
             *  PRODUCT ENDPOINTS
             * ------------------------------ */

            // Get all products (paginated)
            getECommerceProducts: build.query<GetECommerceProductsApiResponse, GetECommerceProductsApiArg>({
                query: ({ page = 1, perPage = 10 } = {}) => ({
                    url: `/api/products`,
                    params: { page, per_page: perPage },
                }),
                providesTags: ['eCommerce_products'],
            }),

            // Get single product by ID
            getECommerceProduct: build.query<GetECommerceProductApiResponse, GetECommerceProductApiArg>({
                query: (productId) => ({
                    url: `/api/products/${productId}`,
                }),
                providesTags: ['eCommerce_product', 'eCommerce_products'],
            }),

            // Create a new product
            createECommerceProduct: build.mutation<CreateECommerceProductApiResponse, CreateECommerceProductApiArg>({
                query: (newProduct) => ({
                    url: `/api/products`,
                    method: 'POST',
                    body: newProduct,
                }),
                invalidatesTags: ['eCommerce_products', 'eCommerce_product'],
            }),

            // Update an existing product
            updateECommerceProduct: build.mutation<UpdateECommerceProductApiResponse, UpdateECommerceProductApiArg>({
                query: (product) => ({
                    url: `/api/products/${product.id}`,
                    method: 'PUT',
                    body: product,
                }),
                invalidatesTags: ['eCommerce_product', 'eCommerce_products'],
            }),

            // Delete a single product
            deleteECommerceProduct: build.mutation<DeleteECommerceProductApiResponse, DeleteECommerceProductApiArg>({
                query: (productId) => ({
                    url: `/api/products/${productId}`,
                    method: 'DELETE',
                }),
                invalidatesTags: ['eCommerce_product', 'eCommerce_products'],
            }),

            // Delete multiple products
            deleteECommerceProducts: build.mutation<DeleteECommerceProductsApiResponse, DeleteECommerceProductsApiArg>({
                query: (productIds) => ({
                    url: `/api/products`,
                    method: 'DELETE',
                    body: { ids: productIds },
                }),
                invalidatesTags: ['eCommerce_product', 'eCommerce_products'],
            }),

            // Get products from other sellers (for import)
            getOtherSellersProducts: build.query<GetOtherSellersProductsApiResponse, GetOtherSellersProductsApiArg>({
                query: ({ page = 1, perPage = 20, search, categoryId, includeOwn } = {}) => ({
                    url: `/api/products/other-vendors`,
                    params: {
                        page,
                        per_page: perPage,
                        ...(search && { search }),
                        ...(categoryId && { category_id: categoryId }),
                        ...(includeOwn && { include_own: true }),
                    },
                }),
                providesTags: ['eCommerce_products'],
            }),

            // Import a product from another vendor
            importProduct: build.mutation<ImportProductApiResponse, ImportProductApiArg>({
                query: ({ productId, paymentMethod, quantity, creditDays, paymentIntentId, importFromOwn }) => ({
                    url: `/api/products/${productId}/import`,
                    method: 'POST',
                    body: {
                        payment_method: paymentMethod || 'instant',
                        quantity: quantity || 1,
                        ...(paymentMethod === 'credit' && creditDays && { credit_days: creditDays }),
                        ...(paymentMethod === 'instant' && paymentIntentId && { payment_intent_id: paymentIntentId }),
                        ...(importFromOwn && { import_from_own: true }),
                    },
                }),
                invalidatesTags: ['eCommerce_product', 'eCommerce_products'],
            }),

            // Get products from suppliers (Wholesale Catalog)
            getSupplierProducts: build.query<GetSupplierProductsApiResponse, GetSupplierProductsApiArg>({
                query: ({ page = 1, perPage = 20, search, categoryId, inStock } = {}) => ({
                    url: `/api/products/suppliers`,
                    params: {
                        page,
                        per_page: perPage,
                        ...(search && { search }),
                        ...(categoryId && { category_id: categoryId }),
                        ...(inStock !== undefined && { in_stock: inStock }),
                    },
                }),
                providesTags: ['eCommerce_products'],
            }),

        }),
        overrideExisting: false,
    });

export default ProductsLaravelApi;

/** -----------------------------------------------------------------
 * PRODUCT TYPES
 * ----------------------------------------------------------------- */

export type GetECommerceProductsApiResponse = {
    status: number;
    message: string;
    data: EcommerceProduct[];
    pagination: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
};
export type GetECommerceProductsApiArg = { page?: number; perPage?: number };

export type GetECommerceProductApiResponse = {
    status: number;
    message: string;
    data: EcommerceProduct;
};
export type GetECommerceProductApiArg = string;

export type CreateECommerceProductApiResponse = {
    status: number;
    message: string;
    data: EcommerceProduct;
};
export type CreateECommerceProductApiArg = PartialDeep<EcommerceProduct>;

export type UpdateECommerceProductApiResponse = {
    status: number;
    message: string;
    data: EcommerceProduct;
};
export type UpdateECommerceProductApiArg = PartialDeep<EcommerceProduct>;

export type DeleteECommerceProductApiResponse = {
    status: number;
    message: string;
    data: null;
};
export type DeleteECommerceProductApiArg = string;

export type DeleteECommerceProductsApiResponse = {
    status: number;
    message: string;
    data: null;
};
export type DeleteECommerceProductsApiArg = string[];

export type GetOtherSellersProductsApiResponse = {
    products?: {
        data: EcommerceProduct[];
        meta: {
            current_page: number;
            from: number;
            to: number;
            per_page: number;
            last_page: number;
            total: number;
        };
        links: {
            first: string | null;
            last: string | null;
            prev: string | null;
            next: string | null;
        };
    };
    // Fallback structure
    data?: EcommerceProduct[];
    pagination?: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
};
export type GetOtherSellersProductsApiArg = {
    page?: number;
    perPage?: number;
    search?: string;
    categoryId?: string;
    includeOwn?: boolean; // Include own products for importing from old listings
};

export type ImportProductApiResponse = {
    status: number;
    message: string;
    data: {
        product: EcommerceProduct;
        wholesale_order?: {
            order_number: string;
            payment_method: 'instant' | 'credit';
            total: number;
            payment_status: string;
            due_date?: string;
        };
    };
};
export type ImportProductApiArg = {
    productId: string;
    paymentMethod?: 'instant' | 'credit';
    quantity?: number;
    creditDays?: 7 | 15 | 30 | 60;
    paymentIntentId?: string; // Stripe payment intent ID for instant payments
    importFromOwn?: boolean; // Allow importing from own old listings
};

export type GetSupplierProductsApiResponse = {
    status: number;
    message: string;
    data: EcommerceProduct[];
    products?: {
        data: EcommerceProduct[];
        meta?: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
    pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
};

export type GetSupplierProductsApiArg = {
    page?: number;
    perPage?: number;
    search?: string;
    categoryId?: number | string;
    inStock?: boolean;
};


export type EcommerceProduct = {
    id: string;
    active: number;
    store_id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    price_tax_excl: number;
    price_tax_incl: number;
    compared_price: number;
    sale_price: number | null;
    sku: string | null;
    stock_quantity: number;
    quantity: number;
    gallery_images: string[] | null;
    featured_image_id: string | null;
    gallery: string[] | null;
    featured_image: string[] | null;
    category_ids: string[] | null;
    categories: string[] | null;
    product_attributes: string[] | null;
    tag_ids: string[] | null;
    tags: string[] | null;
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    // Delivery and postal code fields
    store_postcode?: string | null;
    delivery_radius?: number | null;
    delivery_slots?: string | null;
    ready_in_minutes?: number | null;
    enable_pickup?: boolean;
    shipping_charge_regular?: number;
    shipping_charge_same_day?: number;
    // QC & Policies fields
    condition?: string | null;
    condition_notes?: string | null;
    returns?: string | null;
    warranty?: string | null;
    box_contents?: string | null;
    // Subscription fields
    subscription_enabled?: boolean | number;
    subscription_frequencies?: string | null;
    // Extra fields
    extraFields?: any;
    // Variants and attributes
    product_variants?: any[];
    variants?: any[];
    main_category?: any;
    subcategory?: any[];
    subcategories?: any[];
};

/** -----------------------------------------------------------------
 * RTK HOOK EXPORTS
 * ----------------------------------------------------------------- */

export const {
    useGetECommerceProductsQuery,
    useGetECommerceProductQuery,
    useCreateECommerceProductMutation,
    useUpdateECommerceProductMutation,
    useDeleteECommerceProductMutation,
    useDeleteECommerceProductsMutation,
    useGetOtherSellersProductsQuery,
    useImportProductMutation,
    useGetSupplierProductsQuery,
} = ProductsLaravelApi;

// Optional: for Redux integration
export type ProductsLaravelApiType = {
    [ProductsLaravelApi.reducerPath]: ReturnType<typeof ProductsLaravelApi.reducer>;
};