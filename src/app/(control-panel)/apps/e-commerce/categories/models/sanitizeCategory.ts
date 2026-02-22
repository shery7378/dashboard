import { EcommerceCategory } from '../../apis/CategoriesLaravelApi';
import { createDefaultCategory, slugify } from './CategoryModel';

export function sanitizeCategory(data: Partial<EcommerceCategory>): EcommerceCategory {
	const defaults = createDefaultCategory();

	// Handle image_url from API response - construct full URL if needed
	let imageValue = data.image ?? null;

	if (data.image_url) {
		// Use image_url from API if available
		if (data.image_url.startsWith('http://') || data.image_url.startsWith('https://')) {
			imageValue = data.image_url;
		} else if (data.image_url.startsWith('/')) {
			// If it starts with /, prepend API base URL
			const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
			imageValue = `${apiBaseUrl}${data.image_url}`;
		} else {
			imageValue = data.image_url;
		}
	} else if (data.image) {
		// If image_url is not available but image is, construct URL if needed
		if (
			!data.image.startsWith('http://') &&
			!data.image.startsWith('https://') &&
			!data.image.startsWith('data:')
		) {
			const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

			if (data.image.startsWith('/')) {
				imageValue = `${apiBaseUrl}${data.image}`;
			} else {
				imageValue = `${apiBaseUrl}/storage/${data.image}`;
			}
		}
	}

	return {
		...defaults,
		...data,
		category_type: data.parent_id === null ? 'parent' : 'child', // ✅ Add this line
		meta_title: data.meta_title ?? '',
		meta_description: data.meta_description ?? '',
		meta_keywords: data.meta_keywords ?? '',
		slug: data.slug ?? slugify(data.name ?? ''),
		description: data.description ?? '',
		image: imageValue,
		parent_id: data.parent_id ?? null,
		active: data.active ?? 0
	};
}
