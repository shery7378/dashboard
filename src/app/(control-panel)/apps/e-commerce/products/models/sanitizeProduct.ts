import _ from 'lodash';
import { PartialDeep } from 'type-fest';
import { EcommerceProduct } from '../../apis/ProductsLaravelApi';

/**
 * Generates a URL-friendly slug from a given string.
 * Example: "New Product" -> "new-product"
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
 * Sanitizes and normalizes partial product input into a full EcommerceProduct object.
 */
export function sanitizeProduct(data: PartialDeep<EcommerceProduct>): EcommerceProduct {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';

    // Handle gallery images
    const images = data.images ?? [];
    const featuredId = data.featured_image_id ?? images?.[0]?.id ?? '';

    const gallery_images = images.map((img) => ({
        ...img,
        url: img.url?.startsWith('http') ? img.url : `${apiBase}/${img.url}`,
        is_featured: img.id === featuredId,
    }));

    return {
        id: data.id ?? '',
        attributes: [],
        extraFields: {},
        store_id: data.store_id ?? '',
        name: data.name ?? '',
        slug: data.slug ?? slugify(data.name ?? ''),
        description: data.description ?? '',
        categories: data.categories ?? [],
        product_attributes: data.product_attributes ?? [],
        product_variants: data.product_variants ?? [],
        main_category: data.main_category ?? null,
        subcategory: data.subcategories ?? [],
        tags: data.tags ?? [],
        price: data.price ?? 0,
        price_tax_excl: data.price_tax_excl ?? 0,
        price_tax_incl: data.price_tax_incl ?? 0,
        compared_price: data.compared_price ?? 0,
        tax_rate: data.tax_rate ?? 0,
        extra_shipping_fee: data.extra_shipping_fee ?? 0,
        quantity: data.quantity ?? 0,
        sku: data.sku ?? '',
        width: data.width ?? '',
        height: data.height ?? '',
        depth: data.depth ?? '',
        weight: data.weight ?? '',
        image: data.image ?? '', // base64 or temp path
        featured_image_id: featuredId,
        featured_image: '',
        images: images,
        gallery_images: gallery_images,
        total: data.total ?? null,
        meta_title: data.meta_title ?? '',
        meta_keywords: data.meta_keywords ?? '',
        meta_description: data.meta_description ?? '',
        active: data.active ?? true,
        created_at: data.created_at ?? '',
        updated_at: data.updated_at ?? '',
        deleted_at: data.deleted_at ?? null,
    };
}
