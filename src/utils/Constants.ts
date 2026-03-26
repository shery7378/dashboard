export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
export const IMAGES_URL = API_URL;
export const PLACEHOLDER_IMAGE = '/assets/images/apps/ecommerce/product-image-placeholder.png';

/**
 * Ensures an image URL is formatted correctly.
 * If null, returns the placeholder. If already a full URL, returns as-is.
 * Otherwise, prefixes with API_URL.
 * 
 * @param image string | null
 * @returns string
 */
export function formatImageUrl(image?: string | null): string {
	if (!image) return PLACEHOLDER_IMAGE;
	
	// If it's a full URL, return as-is
	if (image.startsWith('http') || image.startsWith('data:') || image.startsWith('/assets')) {
		return image;
	}

	// Remove leading slash if exists and join with API_URL
	const path = image.replace(/^\/+/, '');
	const baseUrl = API_URL.replace(/\/+$/, '');
	
	return `${baseUrl}/${path}`;
}

/**
 * Standard relative date formatting for things like "Created At".
 * 
 * @param date string | Date
 * @returns string
 */
export function formatDate(date: string | Date | number): string {
    if (!date) return '—';
	return new Date(date).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}

