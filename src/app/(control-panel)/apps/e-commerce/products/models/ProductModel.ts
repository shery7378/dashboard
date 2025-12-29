import _ from 'lodash';
import { PartialDeep } from 'type-fest';
import { EcommerceProduct } from '../../apis/ProductsLaravelApi';

/**
 * Generates a URL-friendly slug from a given string.
 * Example: "New Category Name" -> "new-category-name"
 */
export function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '') // Remove special characters
		.replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
		.replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * The product model matching Laravel's ProductRequest (snake_case).
 */
const ProductModel = (data: PartialDeep<EcommerceProduct>) => {
	const fallbackImageId = data?.images?.[0]?.id ?? '';

	// Convert `images` to `gallery_images` with is_featured flag
	const gallery_images = (data?.images ?? []).map((img) => ({
		...img,
		url: `/${img.url}`, // adjust if needed
		is_featured: img.id === data?.featured_image_id,
	}));

	// Handle null/undefined values - convert null to appropriate defaults
	const normalizedData = {
		...data,
		tags: data?.tags ?? (data?.tags === null ? [] : []),
		product_attributes: data?.product_attributes ?? (data?.product_attributes === null ? [] : []),
		attributes: data?.attributes ?? (data?.attributes === null ? [] : []),
		price_tax_excl: data?.price_tax_excl ?? (data?.price_tax_excl === null ? 0 : 0),
		price_tax_incl: data?.price_tax_incl ?? (data?.price_tax_incl === null ? 0 : 0),
		price: data?.price ?? (data?.price === null ? 0 : 0),
		quantity: data?.quantity ?? (data?.quantity === null ? 0 : 0),
		product_variants: (data?.product_variants ?? (data?.product_variants === null ? [] : [])).map((variant: any) => ({
			...variant,
			compared_price: variant?.compared_price ?? 0,
			price_tax_excl: variant?.price_tax_excl ?? variant?.price ?? 0,
			quantity: variant?.quantity ?? variant?.qty ?? 0,
		})),
		variants: (data?.variants ?? (data?.variants === null ? [] : [])).map((variant: any) => ({
			...variant,
			compared_price: variant?.compared_price ?? 0,
			price_tax_excl: variant?.price_tax_excl ?? variant?.price ?? 0,
			quantity: variant?.quantity ?? variant?.qty ?? 0,
		})),
	};

	return _.defaults(normalizedData || {}, {
		name: '',
		slug: '',
		description: '',
		attributes: [],
		product_attributes: [], // Ensure product_attributes is always an array
		extraFields: {},
		// categories: [],
		tags: [],
		featured_image_id: fallbackImageId, // ✅ snake_case
		images: [],
		price_tax_excl: 0,
		price_tax_incl: 0,
		tax_rate: 0,
		compared_price: 0,
		quantity: 0,
		sku: '',
		width: '',
		height: '',
		depth: '',
		weight: '',
		extra_shipping_fee: 0,
		price: 0,
		active: 0,
		image: '', // base64 or uploaded path
		gallery_images: gallery_images,
		product_variants: [], // Always initialize variants field (backend requires it)
		variants: [], // Also initialize variants field for compatibility
		delivery_slots: '12-3pm', // Default delivery slots for same-day delivery
		store_postcode: '', // Store postcode for same-day delivery
		total: null,
		meta_title: '',
		meta_keywords: '',
		meta_description: '',
	});
};

export default ProductModel;
