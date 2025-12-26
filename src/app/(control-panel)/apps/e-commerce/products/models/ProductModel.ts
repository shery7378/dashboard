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

	return _.defaults(data || {}, {
		name: '',
		slug: '',
		description: '',
		attributes: [],
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
		total: null,
		meta_title: '',
		meta_keywords: '',
		meta_description: '',
	});
};

export default ProductModel;
