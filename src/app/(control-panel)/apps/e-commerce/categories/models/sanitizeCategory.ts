import { EcommerceCategory } from '../../apis/CategoriesLaravelApi';
import { createDefaultCategory, slugify } from './CategoryModel';

export function sanitizeCategory(data: Partial<EcommerceCategory>): EcommerceCategory {
	const defaults = createDefaultCategory();

	return {
		...defaults,
		...data,
		category_type: data.parent_id === null ? 'parent' : 'child', // ✅ Add this line
		meta_title: data.meta_title ?? '',
		meta_description: data.meta_description ?? '',
		meta_keywords: data.meta_keywords ?? '',
		slug: data.slug ?? slugify(data.name ?? ''),
		description: data.description ?? '',
		image: data.image ?? null,
		parent_id: data.parent_id ?? null,
		active: data.active ?? 0,
	};
}
