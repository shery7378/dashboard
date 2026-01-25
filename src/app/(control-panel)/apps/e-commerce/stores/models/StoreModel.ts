import { EcommerceStore } from '../../apis/StoresLaravelApi';

/**
 * Converts a string into a URL-friendly slug.
 * Example: "Super Market 24/7" -> "super-market-24-7"
 */
export function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '') // Remove all non-word characters
		.replace(/[\s_-]+/g, '-') // Replace spaces/underscores with -
		.replace(/^-+|-+$/g, ''); // Trim leading/trailing -
}

/**
 * Returns a blank default store object to initialize forms.
 * Matches the Laravel `Store` model structure.
 */
export function createDefaultStore(): EcommerceStore {
	return {
		id: '',
		user_id: '',
		name: '',
		slug: '',
		description: '',
		contact_email: '',
		contact_phone: '',
		address: '',
		zip_code: '',
		city: '',
		country: '',
		logo: null,
		banner_image: null,
		active: false,
		meta_title: '',
		meta_description: '',
		meta_keywords: '',
		latitude: null,
		longitude: null,
		rating: null,
		products_count: null,
		offers_pickup: false,
		offers_delivery: false,
		delivery_radius: null,
		delivery_slots: [],
		created_at: '',
		updated_at: '',
		deleted_at: null,
		user: {
			id: '',
			name: '',
			email: ''
		}
	};
}
