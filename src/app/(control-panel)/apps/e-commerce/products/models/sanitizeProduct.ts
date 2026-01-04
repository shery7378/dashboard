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

    // Transform categories array into main_category and subcategory format
    let mainCategory = data.main_category ?? null;
    let subcategories = data.subcategories ?? [];
    
    // Debug: Log category data
    console.log('sanitizeProduct - Category data:', {
        hasMainCategory: !!data.main_category,
        hasSubcategories: !!data.subcategories,
        hasCategories: !!data.categories,
        categoriesLength: Array.isArray(data.categories) ? data.categories.length : 0,
        categories: data.categories
    });
    
    // If main_category is not provided but categories array exists, transform it
    if (!mainCategory && data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
        // Find main category (parent_id === null or undefined)
        const mainCat = data.categories.find((cat: any) => {
            const parentId = cat.parent_id ?? cat.parentId;
            return !parentId || parentId === null || parentId === '';
        });
        
        if (mainCat) {
            mainCategory = {
                id: mainCat.id ?? mainCat.category_id,
                name: mainCat.name ?? '',
                children: mainCat.children ?? []
            };
        }
        
        // Find subcategories (parent_id !== null, or children of main category)
        subcategories = data.categories
            .filter((cat: any) => {
                const parentId = cat.parent_id ?? cat.parentId;
                return parentId && parentId !== null && parentId !== '';
            })
            .map((cat: any) => ({
                id: cat.id ?? cat.category_id,
                name: cat.name ?? ''
            }));
        
        // If no subcategories found but main category has children, use those
        if (subcategories.length === 0 && mainCategory?.children && Array.isArray(mainCategory.children)) {
            subcategories = mainCategory.children.map((child: any) => ({
                id: child.id ?? child.category_id,
                name: child.name ?? ''
            }));
        }
        
        console.log('sanitizeProduct - Transformed categories:', {
            mainCategory,
            subcategories
        });
    }
    
    // If main_category exists but subcategories don't, try to get from main_category.children
    if (mainCategory && (!subcategories || subcategories.length === 0)) {
        const mainCatObj = mainCategory as any;
        if (mainCatObj.children && Array.isArray(mainCatObj.children)) {
            subcategories = mainCatObj.children.map((child: any) => ({
                id: child.id ?? child.category_id,
                name: child.name ?? ''
            }));
        }
    }

    // Extract store_postcode and delivery fields from data or extraFields
    const extraFields = data.extraFields ?? {};
    const extraFieldsParsed = typeof extraFields === 'string' ? JSON.parse(extraFields) : extraFields;
    
    return {
        id: data.id ?? '',
        attributes: [],
        extraFields: extraFieldsParsed,
        store_id: data.store_id ?? '',
        name: data.name ?? '',
        slug: data.slug ?? slugify(data.name ?? ''),
        description: data.description ?? '',
        categories: data.categories ?? [],
        product_attributes: data.product_attributes ?? [],
        product_variants: data.product_variants ?? [],
        main_category: mainCategory,
        subcategory: subcategories,
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
        // Delivery and postal code fields
        store_postcode: data.store_postcode ?? extraFieldsParsed?.store_postcode ?? extraFieldsParsed?.postcode ?? '',
        delivery_radius: data.delivery_radius ?? extraFieldsParsed?.delivery_radius ?? null,
        delivery_slots: data.delivery_slots ?? extraFieldsParsed?.delivery_slots ?? '12-3pm',
        ready_in_minutes: data.ready_in_minutes ?? extraFieldsParsed?.ready_in_minutes ?? null,
        enable_pickup: data.enable_pickup ?? extraFieldsParsed?.enable_pickup ?? false,
        shipping_charge_regular: data.shipping_charge_regular ?? extraFieldsParsed?.shipping_charge_regular ?? 0,
        shipping_charge_same_day: data.shipping_charge_same_day ?? extraFieldsParsed?.shipping_charge_same_day ?? 0,
        // QC & Policies fields
        condition: data.condition ?? extraFieldsParsed?.condition ?? null,
        condition_notes: data.condition_notes ?? extraFieldsParsed?.condition_notes ?? null,
        returns: data.returns ?? extraFieldsParsed?.returns ?? null,
        warranty: data.warranty ?? extraFieldsParsed?.warranty ?? null,
        box_contents: data.box_contents ?? extraFieldsParsed?.box_contents ?? null,
    };
}
