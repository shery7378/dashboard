// models/CategoryModel.ts

import { EcommerceCategory } from '../../apis/CategoriesLaravelApi';

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
 * Returns a default empty EcommerceCategory object.
 */
export function createDefaultCategory(): EcommerceCategory {
	return {
		id: '',
		name: '',
		slug: '',
		description: '',
		image: null,
		parent_id: null,
		active: 0,
		meta_title: '',
		meta_description: '',
		meta_keywords: '',
		created_at: '',
		updated_at: '',
		deleted_at: null,
		category_type: 'child'
	};
}
