import { apiServiceLaravel as api } from '@/store/apiServiceLaravel';
import { PartialDeep } from 'type-fest';

// Tags for cache invalidation and auto-refetching
export const addTagTypes = ['eCommerce_categories', 'eCommerce_category'] as const;

// Enhance base API with tag support
const CategoriesLaravelApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
	endpoints: (build) => ({
		/** ------------------------------
		 *  CATEGORY ENDPOINTS
		 * ------------------------------ */

		// Get all categories (paginated)
		getECommerceCategories: build.query<GetECommerceCategoriesApiResponse, GetECommerceCategoriesApiArg>({
			query: ({ page = 1, perPage = 10 } = {}) => ({
				url: `/api/categories`,
				params: { page, per_page: perPage }
			}),
			providesTags: ['eCommerce_categories']
		}),

		// Get single category by ID
		getECommerceCategory: build.query<GetECommerceCategoryApiResponse, GetECommerceCategoryApiArg>({
			query: (categoryId) => ({
				url: `/api/categories/${categoryId}`
			}),
			providesTags: ['eCommerce_category', 'eCommerce_categories']
		}),

		// Create a new category
		createECommerceCategory: build.mutation<CreateECommerceCategoryApiResponse, CreateECommerceCategoryApiArg>({
			query: (newCategory) => ({
				url: `/api/categories`,
				method: 'POST',
				body: newCategory
			}),
			invalidatesTags: ['eCommerce_categories', 'eCommerce_category']
		}),

		// Update an existing category
		updateECommerceCategory: build.mutation<UpdateECommerceCategoryApiResponse, UpdateECommerceCategoryApiArg>({
			query: (category) => ({
				url: `/api/categories/${category.id}`,
				method: 'PUT',
				body: category
			}),
			invalidatesTags: ['eCommerce_category', 'eCommerce_categories']
		}),

		// Delete a single category
		deleteECommerceCategory: build.mutation<DeleteECommerceCategoryApiResponse, DeleteECommerceCategoryApiArg>({
			query: (categoryId) => ({
				url: `/api/categories/${categoryId}`,
				method: 'DELETE'
			}),
			invalidatesTags: ['eCommerce_category', 'eCommerce_categories']
		}),

		// Delete multiple categories
		deleteECommerceCategories: build.mutation<
			DeleteECommerceCategoriesApiResponse,
			DeleteECommerceCategoriesApiArg
		>({
			query: (categoryIds) => ({
				url: `/api/categories`,
				method: 'DELETE',
				body: { ids: categoryIds }
			}),
			invalidatesTags: ['eCommerce_category', 'eCommerce_categories']
		}),

		// Assign products to a category
		assignProductsToCategory: build.mutation<AssignProductsToCategoryApiResponse, AssignProductsToCategoryApiArg>({
			query: ({ categoryId, productIds }) => ({
				url: `/api/categories/${categoryId}/assign-products`,
				method: 'POST',
				body: { productIds }
			}),
			invalidatesTags: ['eCommerce_category', 'eCommerce_categories']
		}),

		// Parent Categories only
		getECommerceParentCategories: build.query<GetECommerceParentCategoriesApiResponse, void>({
			query: () => ({
				url: `/api/categories/parents`
			}),
			providesTags: ['eCommerce_categories']
		}),

		// Get all parent categories with children (for product form)
		getECommerceAllCategories: build.query<GetECommerceCategoriesApiResponse, void>({
			query: () => ({
				url: `/api/categories/getAllCategories`
			}),
			providesTags: ['eCommerce_categories']
		})
	}),
	overrideExisting: false
});

export default CategoriesLaravelApi;

/** -----------------------------------------------------------------
 * CATEGORY TYPES
 * ----------------------------------------------------------------- */

export type GetECommerceCategoriesApiResponse = {
	status: number;
	message: string;
	data: EcommerceCategory[];
	pagination: {
		total: number;
		per_page: number;
		current_page: number;
		last_page: number;
	};
};
export type GetECommerceCategoriesApiArg = { page?: number; perPage?: number };

export type GetECommerceCategoryApiResponse = {
	status: number;
	message: string;
	data: EcommerceCategory;
};
export type GetECommerceCategoryApiArg = string;

export type CreateECommerceCategoryApiResponse = {
	status: number;
	message: string;
	data: EcommerceCategory;
};
export type CreateECommerceCategoryApiArg = PartialDeep<EcommerceCategory>;

export type UpdateECommerceCategoryApiResponse = {
	status: number;
	message: string;
	data: EcommerceCategory;
};
export type UpdateECommerceCategoryApiArg = PartialDeep<EcommerceCategory>;

export type DeleteECommerceCategoryApiResponse = {
	status: number;
	message: string;
	data: null;
};
export type DeleteECommerceCategoryApiArg = string;

export type DeleteECommerceCategoriesApiResponse = {
	status: number;
	message: string;
	data: null;
};
export type DeleteECommerceCategoriesApiArg = string[];

export type AssignProductsToCategoryApiResponse = unknown;
export type AssignProductsToCategoryApiArg = {
	categoryId: string;
	productIds: string[];
};

export type GetECommerceParentCategoriesApiResponse = {
	status: number;
	message: string;
	data: {
		id: string;
		name: string;
	}[];
};

export type EcommerceCategory = {
	id: string;
	name: string;
	slug: string;
	description: string;
	image: string | null;
	parent_id: string | null;
	active: number | null;
	meta_title: string | null;
	meta_description: string | null;
	meta_keywords: string | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
	children?: EcommerceCategory[];
	category_type: 'parent' | 'child';
};

/** -----------------------------------------------------------------
 * RTK HOOK EXPORTS
 * ----------------------------------------------------------------- */

export const {
	useGetECommerceCategoriesQuery,
	useGetECommerceCategoryQuery,
	useCreateECommerceCategoryMutation,
	useUpdateECommerceCategoryMutation,
	useDeleteECommerceCategoryMutation,
	useDeleteECommerceCategoriesMutation,
	useAssignProductsToCategoryMutation,
	useGetECommerceParentCategoriesQuery,
	useGetECommerceAllCategoriesQuery
} = CategoriesLaravelApi;

// Optional: for Redux integration
export type CategoriesLaravelApiType = {
	[CategoriesLaravelApi.reducerPath]: ReturnType<typeof CategoriesLaravelApi.reducer>;
};
