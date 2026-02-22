import { EcommerceStore } from '../../apis/StoresLaravelApi';
import { createDefaultStore } from './StoreModel';

/**
 * Sanitizes and normalizes partial store input into a full EcommerceStore object.
 * Useful for form initialization, edit views, and avoiding undefined fields.
 */
export function sanitizeStore(data: Partial<EcommerceStore>): EcommerceStore {
	const defaults = createDefaultStore();

	const normalizedDeliverySlots: string[] = (() => {
		const raw: any = (data as any).delivery_slots;

		if (Array.isArray(raw)) {
			return raw.map((s) => String(s).trim()).filter(Boolean);
		}

		if (typeof raw === 'string') {
			return raw
				.split(/[,\n]/g)
				.map((s) => s.trim())
				.filter(Boolean);
		}

		return [];
	})();

	return {
		...defaults,
		...data,
		// Ensures fallback values for nullable or optional fields
		name: data.name ?? '',
		slug: data.slug ?? '',
		description: data.description ?? '',
		contact_email: data.contact_email ?? '',
		contact_phone: data.contact_phone ?? '',
		address: data.address ?? '',
		zip_code: data.zip_code ?? '',
		city: data.city ?? '',
		country: data.country ?? '',
		logo: data.logo ?? null,
		banner_image: data.banner_image ?? null,
		meta_title: data.meta_title ?? '',
		meta_description: data.meta_description ?? '',
		meta_keywords: data.meta_keywords ?? '',
		latitude: data.latitude ?? null,
		longitude: data.longitude ?? null,
		rating: data.rating ?? null,
		offers_pickup: data.offers_pickup ?? false,
		offers_delivery: data.offers_delivery ?? false,
		delivery_radius: data.delivery_radius ?? null,
		delivery_slots: normalizedDeliverySlots,
		active: data.active ?? false,
		user: data.user ?? {
			id: '',
			name: '',
			email: ''
		},
		created_at: data.created_at ?? '',
		updated_at: data.updated_at ?? '',
		deleted_at: data.deleted_at ?? null
	};
}
