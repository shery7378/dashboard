export const API_BASE_URL =
	process.env.NODE_ENV === 'development'
		? `${process.env.NEXT_PUBLIC_API_URL}`
		: // ? `http://localhost:${process.env.NEXT_PUBLIC_PORT || 3000}`
			// ? process.env.NEXTAUTH_URL
			process.env.NEXT_PUBLIC_API_URL || '/';

// Define the types for options and configuration
type FetchOptions = RequestInit;

export class FetchApiError extends Error {
	status: number;

	data: unknown;

	constructor(status: number, data: unknown) {
		super(`FetchApiError: ${status}`);
		this.status = status;
		this.data = data;
	}
}

// Global headers configuration
export const globalHeaders: Record<string, string> = {};

// Function to update global headers
export const setGlobalHeaders = (newHeaders: Record<string, string>) => {
	Object.assign(globalHeaders, newHeaders);
};

export const removeGlobalHeaders = (headerKeys: string[]) => {
	headerKeys.forEach((key) => {
		delete globalHeaders[key];
	});
};

// Main apiFetch function with interceptors and type safety
const apiFetchLaravel = async (endpoint: string, options: FetchOptions = {}) => {
	const { headers, ...restOptions } = options;
	const method = restOptions.method || 'GET';
	// Set default headers, including global headers
	const config: FetchOptions = {
		headers: {
			...(method !== 'GET' && { 'Content-Type': 'application/json' }),
			...globalHeaders,
			...headers
		},
		...restOptions
	};

	try {
		const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

		if (!response.ok) {
			// Try to parse error response, but handle empty/invalid JSON gracefully
			let errorData;
			const contentType = response.headers.get('content-type');

			if (contentType && contentType.includes('application/json')) {
				try {
					const text = await response.text();
					errorData = text ? JSON.parse(text) : { message: `HTTP ${response.status}` };
				} catch (parseError) {
					errorData = { message: `HTTP ${response.status}: Failed to parse error response` };
				}
			} else {
				// Try to read as text for non-JSON responses
				try {
					const text = await response.text();
					errorData = { message: text || `HTTP ${response.status}` };
				} catch (textError) {
					errorData = { message: `HTTP ${response.status}` };
				}
			}

			// Log server errors (500+) with more context
			if (response.status >= 500) {
				console.error(`Server Error in apiFetch: Error: FetchApiError: ${response.status}`, {
					endpoint: `${API_BASE_URL}${endpoint}`,
					method: config.method || 'GET',
					errorData,
					hasAuthHeader: config.headers && 'Authorization' in (config.headers as Record<string, string>)
				});
			}

			throw new FetchApiError(response.status, errorData);
		}

		return response;
	} catch (error) {
		// Only log if it's not already a FetchApiError (to avoid duplicate logs)
		if (!(error instanceof FetchApiError)) {
			console.error('Error in apiFetch:', error);
		}

		throw error;
	}
};

export default apiFetchLaravel;
