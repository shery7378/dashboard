/**
 * Helper utility to generate absolute URLs for backend storage assets.
 *
 * @param {string} path - The relative path to the storage asset (e.g., '/storage/images/logo.png')
 * @returns {string} The full absolute URL pointing to the backend
 */
export const getStorageUrl = (path: string): string => {
	if (!path) return '';

	if (path.startsWith('http')) return path; // Already absolute

	const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
	const cleanBase = baseUrl.replace(/\/$/, '');
	const cleanPath = path.startsWith('/') ? path : `/${path}`;

	return `${cleanBase}${cleanPath}`;
};
