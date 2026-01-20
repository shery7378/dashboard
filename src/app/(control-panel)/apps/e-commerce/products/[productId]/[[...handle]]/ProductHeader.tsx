'use client';

import { useState } from 'react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { motion } from 'motion/react';
import { useFormContext } from 'react-hook-form';
import { useParams } from 'next/navigation';
import _ from 'lodash';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import PageBreadcrumb from 'src/components/PageBreadcrumb';
import useNavigate from '@fuse/hooks/useNavigate';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { useSession } from 'next-auth/react';
import { ConfirmDialog, SuccessDialog } from '@/components/DialogComponents';
import {
  EcommerceProduct,
  useCreateECommerceProductMutation,
  useDeleteECommerceProductMutation,
  useUpdateECommerceProductMutation,
} from '../../../apis/ProductsLaravelApi';
import '../../i18n';

/**
 * The product header.
 */
function ProductHeader() {
  const routeParams = useParams<{ productId: string }>();
  const { productId } = routeParams;

  const [createProduct, { isLoading: isCreating }] =
    useCreateECommerceProductMutation();
  const [saveProduct, { isLoading: isSaving }] =
    useUpdateECommerceProductMutation();
  const [removeProduct, { isLoading: isDeleting }] =
    useDeleteECommerceProductMutation();

  const methods = useFormContext();
  const { formState, watch, getValues } = methods;
  const { isValid, dirtyFields, errors, isDirty } = formState;
  
  // Get user role and store_id from session
  const { data: session } = useSession();
  const user = session?.user || session?.db;
  const userRoles = user?.role || session?.db?.role || [];
  
  // Get store_id from session for debugging
  const sessionStoreId = session?.db?.store_id;
  
  // Debug: Log validation state for new products
  if (productId === 'new') {
    console.log('Form validation state:', {
      isValid,
      errors: Object.keys(errors).length > 0 ? errors : 'No errors',
      dirtyFields: Object.keys(dirtyFields),
      isDirty,
      store_id: watch('store_id'),
      name: watch('name'),
      description: watch('description'),
      main_category: watch('main_category'),
      subcategory: watch('subcategory'),
      gallery_images: watch('gallery_images'),
    });
  }

  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { t } = useTranslation('products');

  // ✅ dialog states
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [isDraftSave, setIsDraftSave] = useState(false);

  const { name, gallery_images } = watch() as EcommerceProduct;

  function transformFormValues(values: EcommerceProduct): any {
    // Log ALL form values to see what we're working with
    console.log('transformFormValues - ALL form values:', {
      has_gallery_images: !!values.gallery_images,
      gallery_images_length: Array.isArray(values.gallery_images) ? values.gallery_images.length : 'not array',
      has_images: !!values.images,
      images_length: Array.isArray(values.images) ? values.images.length : 'not array',
      gallery_images_preview: Array.isArray(values.gallery_images) && values.gallery_images.length > 0 
        ? values.gallery_images.slice(0, 2).map((img: any) => ({
            has_url: !!img?.url,
            url_type: typeof img?.url,
            url_starts_with: img?.url ? img.url.substring(0, 50) : 'no url',
            is_base64: img?.url?.startsWith('data:image/'),
          }))
        : 'no images',
    });
    
    // Build categories array from main_category and subcategory
    const categoriesArray: number[] = [];
    
    // Add main category ID if it exists
    if (values.main_category && (values.main_category as any).id) {
      const mainCatId = Number((values.main_category as any).id);
      if (!isNaN(mainCatId) && mainCatId > 0) {
        categoriesArray.push(mainCatId);
      }
    }
    
    // Add subcategory IDs if they exist
    if (values.subcategory && Array.isArray(values.subcategory)) {
      values.subcategory.forEach((subcat: any) => {
        if (subcat && subcat.id) {
          const subCatId = Number(subcat.id);
          if (!isNaN(subCatId) && subCatId > 0 && !categoriesArray.includes(subCatId)) {
            categoriesArray.push(subCatId);
          }
        }
      });
    }
    
    // Fallback to existing categories if main_category/subcategory not provided
    if (categoriesArray.length === 0 && values.categories && Array.isArray(values.categories)) {
      values.categories.forEach((cat: any) => {
        const catId = typeof cat === 'object' ? Number(cat.id) : Number(cat);
        if (!isNaN(catId) && catId > 0 && !categoriesArray.includes(catId)) {
          categoriesArray.push(catId);
        }
      });
    }
    
    console.log('Transforming categories:', {
      main_category: values.main_category,
      subcategory: values.subcategory,
      existing_categories: values.categories,
      final_categories: categoriesArray
    });
    
    // Process images - ensure base64 images are preserved and sent correctly
    const rawImages = values.gallery_images || values.images || [];
    console.log('transformFormValues - Processing images:', {
      total_images: rawImages.length,
      images_preview: rawImages.slice(0, 3).map((img: any) => ({
        has_url: !!img?.url,
        url_preview: img?.url ? img.url.substring(0, 100) : 'no url',
        is_base64: img?.url?.startsWith('data:image/'),
        has_id: !!img?.id,
      })),
    });
    
    const processedImages = rawImages.map((img: any) => {
      if (!img) return null;
      
      // If it's already a base64 data URL, keep it as is
      if (img.url && typeof img.url === 'string' && img.url.startsWith('data:image/')) {
        console.log('transformFormValues - Found base64 image, preserving it');
        return {
          url: img.url, // Keep base64 as-is
          alt_text: img.alt_text || img.alt || null,
          type: img.type || 'gallery',
          is_featured: img.is_featured || false,
          // Don't include id for new base64 images
        };
      }
      
      // If it's a file path, keep it as is (existing image)
      return {
        ...img,
        url: img.url || img.path || '',
      };
    }).filter((img: any) => img && img.url); // Remove null/empty images
    
    console.log('transformFormValues - Processed images:', {
      processed_count: processedImages.length,
      base64_count: processedImages.filter((img: any) => img.url?.startsWith('data:image/')).length,
      file_path_count: processedImages.filter((img: any) => !img.url?.startsWith('data:image/')).length,
    });
    
    const transformed: any = {
      // Include product ID if available (required for update operations)
      ...(productId && productId !== 'new' ? { id: String(productId) } : {}),
      ...values,
      // Preserve main_category and subcategory for backend (backend expects these fields)
      // Only include if they exist in form values (don't create fake ones)
      ...(values.main_category && { main_category: values.main_category }),
      ...(values.subcategory && Array.isArray(values.subcategory) && values.subcategory.length > 0 && { subcategory: values.subcategory }),
      categories: categoriesArray, // Use combined categories array for compatibility
      // CRITICAL: Explicitly set images and gallery_images to ensure base64 images are sent
      // This MUST come after spreading values to override any file paths that might have been set
      images: processedImages,
      gallery_images: processedImages,
      tags: values.tags ?? [],
      active: Number(values.active), // Convert true/false or 1/0 to 1/0
      // Explicitly ensure these fields are included (even if 0 or empty)
      // Convert price fields to numbers (backend requires numeric)
      price_tax_excl: parseFloat(String(values.price_tax_excl ?? values.price ?? 0)) || 0,
      price_tax_incl: parseFloat(String(values.price_tax_incl ?? values.price ?? 0)) || 0,
      price: parseFloat(String(values.price ?? values.price_tax_excl ?? 0)) || 0,
      // Database has 'quantity' column (not 'qty')
      quantity: parseInt(String(values.quantity ?? 0)) || 0,
      // Note: manage_stock and in_stock columns don't exist in the products table
      // Transform product_attributes to attributes format (backend expects 'attributes' not 'product_attributes')
      // Backend expects: attributes: [{ attribute_id: number, values: [number, ...] }]
      attributes: (() => {
        // First check if attributes already exist in the correct format (from API)
        if (values.attributes && Array.isArray(values.attributes) && values.attributes.length > 0) {
          // Check if already in correct format (has attribute_id and values array)
          const firstAttr = values.attributes[0];
          if (firstAttr && typeof firstAttr === 'object' && 'attribute_id' in firstAttr && 'values' in firstAttr) {
            // Already in correct format, just ensure IDs are numbers
            return values.attributes.map((attr: any) => ({
              attribute_id: Number(attr.attribute_id),
              values: Array.isArray(attr.values) ? attr.values.map((v: any) => Number(v)) : []
            }));
          }
        }
        
        // Otherwise, try to transform from product_attributes
        const productAttrs = values.product_attributes ?? (values as any).attributes ?? [];
        if (!Array.isArray(productAttrs) || productAttrs.length === 0) {
          return [];
        }
        
        // Transform from frontend format to backend format
        const attributesMap = new Map<number, number[]>();
        
        productAttrs.forEach((attr: any) => {
          // Handle different possible formats
          const attrId = attr.attribute_id ?? attr.id ?? attr.attributeId;
          const valueId = attr.attribute_value_id ?? attr.value_id ?? attr.valueId ?? attr.id;
          
          // Only process if we have both attribute_id and value_id (backend requires IDs)
          if (attrId && valueId) {
            const numAttrId = Number(attrId);
            const numValueId = Number(valueId);
            
            if (!isNaN(numAttrId) && !isNaN(numValueId)) {
              if (!attributesMap.has(numAttrId)) {
                attributesMap.set(numAttrId, []);
              }
              const valuesArray = attributesMap.get(numAttrId)!;
              if (!valuesArray.includes(numValueId)) {
                valuesArray.push(numValueId);
              }
            }
          } else {
            // Log warning if attribute doesn't have IDs (can't be saved without IDs)
            console.warn('Product attribute missing IDs, skipping:', attr);
          }
        });
        
        // Convert map to array format expected by backend
        return Array.from(attributesMap.entries()).map(([attribute_id, values]) => ({
          attribute_id: Number(attribute_id),
          values: values.map(v => Number(v))
        }));
      })(),
      // Keep product_attributes for compatibility (but backend uses 'attributes')
      product_attributes: values.product_attributes ?? (values as any).attributes ?? [],
      // Ensure description is included
      description: values.description ?? '',
      // Ensure SEO fields are included (backend expects meta object)
      meta: {
        meta_title: values.meta_title ?? (values as any).meta?.meta_title ?? '',
        meta_description: values.meta_description ?? (values as any).meta?.meta_description ?? '',
        meta_keywords: values.meta_keywords ?? (values as any).meta?.meta_keywords ?? '',
      },
      // Also include meta fields at root level for compatibility
      meta_title: values.meta_title ?? (values as any).meta?.meta_title ?? '',
      meta_description: values.meta_description ?? (values as any).meta?.meta_description ?? '',
      meta_keywords: values.meta_keywords ?? (values as any).meta?.meta_keywords ?? '',
      // Store delivery_slots and store_postcode in extraFields (they're not in products table)
      // These fields will be stored in extraFields JSON column or separate table
      extraFields: {
        ...(values.extraFields || {}),
        delivery_slots: values.delivery_slots ?? (values as any).delivery_slots ?? '',
        store_postcode: values.store_postcode ?? (values as any).store_postcode ?? '',
      },
      // Also include at root level for compatibility (backend might handle these separately)
      delivery_slots: values.delivery_slots ?? (values as any).delivery_slots ?? '',
      store_postcode: values.store_postcode ?? (values as any).store_postcode ?? '',
      // Shipping charges - ensure they're sent as numbers
      shipping_charge_regular: parseFloat(String(values.shipping_charge_regular ?? (values as any).shippingChargeRegular ?? 0)) || 0,
      shipping_charge_same_day: parseFloat(String(values.shipping_charge_same_day ?? (values as any).shippingChargeSameDay ?? 0)) || 0,
      // Other delivery fields
      delivery_radius: parseInt(String(values.delivery_radius ?? (values as any).deliveryRadius ?? 5)) || 5,
      ready_in_minutes: parseInt(String(values.ready_in_minutes ?? (values as any).readyInMinutes ?? 45)) || 45,
      enable_pickup: Boolean(values.enable_pickup ?? (values as any).enablePickup ?? false),
      // Subscription fields
      subscription_enabled: Boolean(values.subscription_enabled ?? (values as any).subscriptionEnabled ?? false),
      subscription_frequencies: values.subscription_frequencies ?? (values as any).subscriptionFrequencies ?? null,
    };
    
    // Transform product_variants to variants (backend expects 'variants' field to always exist)
    // Always include variants field, even if empty array, to satisfy backend validation
    if (values.product_variants && Array.isArray(values.product_variants)) {
      // Ensure all variant prices are numeric and all required fields are present
      transformed.variants = values.product_variants.map((variant: any, index: number) => {
        if (variant && typeof variant === 'object') {
          const variantPrice = variant.price !== undefined && variant.price !== null 
            ? parseFloat(String(variant.price)) || 0 
            : 0;
          const variantQty = variant.qty !== undefined && variant.qty !== null
            ? parseInt(String(variant.qty)) || parseInt(String(variant.quantity)) || 0
            : parseInt(String(variant.quantity)) || 0;
          
          // Generate uid and uids if not present (backend requires these)
          const variantUid = variant.uid || variant.sku || `variant-${index + 1}`;
          const variantUids = variant.uids || variantUid;
          
          // Map price - use price_tax_excl if available, otherwise use price
          const finalPrice = variant.price_tax_excl !== undefined && variant.price_tax_excl !== null
            ? parseFloat(String(variant.price_tax_excl)) || variantPrice
            : variantPrice;
          
          return {
            ...variant,
            // Required fields
            name: variant.name || '',
            sku: variant.sku || '',
            uid: variantUid,
            uids: variantUids,
            // Send price in both formats (model expects 'price', database might have 'price_tax_excl')
            price: finalPrice, // Laravel model fillable expects 'price'
            price_tax_excl: finalPrice, // Database column (if exists)
            price_tax_incl: variant.price_tax_incl !== undefined && variant.price_tax_incl !== null
              ? parseFloat(String(variant.price_tax_incl)) || finalPrice
              : finalPrice, // Database column (if exists)
            special_price: variant.special_price !== undefined && variant.special_price !== null
              ? parseFloat(String(variant.special_price)) || 0
              : 0,
            compared_price: variant.compared_price !== undefined && variant.compared_price !== null
              ? parseFloat(String(variant.compared_price)) || 0
              : 0,
            // Send quantity in both formats (model expects 'qty', database might have 'quantity')
            quantity: variantQty, // Database column (if exists)
            qty: variantQty, // Laravel model fillable expects 'qty'
            // Ensure boolean fields are properly set (backend requires these)
            manage_stock: variant.manage_stock !== undefined ? Boolean(variant.manage_stock) : (variantQty > 0 ? true : false),
            in_stock: variant.in_stock !== undefined ? Boolean(variant.in_stock) : (variantQty > 0 ? true : false),
            is_active: variant.is_active !== undefined ? Boolean(variant.is_active) : true,
            is_default: variant.is_default !== undefined ? Boolean(variant.is_default) : false,
            // Position is set by backend, but include if present
            position: variant.position !== undefined ? parseInt(String(variant.position)) || (index + 1) : (index + 1),
            // Preserve variant image if it exists (base64 data URL)
            ...(variant.image && { image: variant.image }),
          };
        }
        return variant;
      });
      console.log('Transforming product_variants to variants:', transformed.variants.length, 'variants');
      console.log('Sample variant data:', transformed.variants.length > 0 ? transformed.variants[0] : 'No variants');
    } else if (values.variants && Array.isArray(values.variants)) {
      // Use variants if it exists directly, but ensure prices are numeric and required fields are present
      transformed.variants = values.variants.map((variant: any, index: number) => {
        if (variant && typeof variant === 'object') {
          const variantPrice = variant.price !== undefined && variant.price !== null 
            ? parseFloat(String(variant.price)) || 0 
            : 0;
          const variantQty = variant.qty !== undefined && variant.qty !== null
            ? parseInt(String(variant.qty)) || parseInt(String(variant.quantity)) || 0
            : parseInt(String(variant.quantity)) || 0;
          
          // Generate uid and uids if not present (backend requires these)
          const variantUid = variant.uid || variant.sku || `variant-${index + 1}`;
          const variantUids = variant.uids || variantUid;
          
          // Map price - use price_tax_excl if available, otherwise use price
          const finalPrice = variant.price_tax_excl !== undefined && variant.price_tax_excl !== null
            ? parseFloat(String(variant.price_tax_excl)) || variantPrice
            : variantPrice;
          
          return {
            ...variant,
            // Required fields
            name: variant.name || '',
            sku: variant.sku || '',
            uid: variantUid,
            uids: variantUids,
            // Send price in both formats (model expects 'price', database might have 'price_tax_excl')
            price: finalPrice, // Laravel model fillable expects 'price'
            price_tax_excl: finalPrice, // Database column (if exists)
            price_tax_incl: variant.price_tax_incl !== undefined && variant.price_tax_incl !== null
              ? parseFloat(String(variant.price_tax_incl)) || finalPrice
              : finalPrice, // Database column (if exists)
            special_price: variant.special_price !== undefined && variant.special_price !== null
              ? parseFloat(String(variant.special_price)) || 0
              : 0,
            compared_price: variant.compared_price !== undefined && variant.compared_price !== null
              ? parseFloat(String(variant.compared_price)) || 0
              : 0,
            // Send quantity in both formats (model expects 'qty', database might have 'quantity')
            quantity: variantQty, // Database column (if exists)
            qty: variantQty, // Laravel model fillable expects 'qty'
            // Ensure boolean fields are properly set
            manage_stock: variant.manage_stock !== undefined ? Boolean(variant.manage_stock) : (variantQty > 0 ? true : false),
            in_stock: variant.in_stock !== undefined ? Boolean(variant.in_stock) : (variantQty > 0 ? true : false),
            is_active: variant.is_active !== undefined ? Boolean(variant.is_active) : true,
            is_default: variant.is_default !== undefined ? Boolean(variant.is_default) : false,
            position: variant.position !== undefined ? parseInt(String(variant.position)) || (index + 1) : (index + 1),
          };
        }
        return variant;
      });
      console.log('Using variants directly:', transformed.variants.length, 'variants');
      console.log('Sample variant data:', transformed.variants.length > 0 ? transformed.variants[0] : 'No variants');
    } else {
      // Always set variants field, even if empty, to satisfy backend validation requirement
      transformed.variants = [];
      console.log('Setting empty variants array (no product_variants found)');
    }
    
    // Ensure variants is always an array (defensive check)
    if (!Array.isArray(transformed.variants)) {
      console.warn('variants is not an array, converting to empty array');
      transformed.variants = [];
    }
    
    // Ensure extraFields always exists (backend requires it)
    if (!transformed.extraFields || typeof transformed.extraFields !== 'object') {
      transformed.extraFields = {};
    }
    
    // Store delivery_slots and store_postcode in extraFields (they're not direct columns in products table)
    // Merge them into extraFields if they exist at root level
    if (transformed.delivery_slots) {
      transformed.extraFields.delivery_slots = transformed.delivery_slots;
    }
    if (transformed.store_postcode) {
      transformed.extraFields.store_postcode = transformed.store_postcode;
    }
    
    // Remove undefined values to avoid sending them to API (but keep required fields)
    // Also preserve fields that are 0 or empty arrays/strings as they are valid values
    Object.keys(transformed).forEach(key => {
      if (transformed[key] === undefined && 
          key !== 'extraFields' && 
          key !== 'variants' && 
          key !== 'categories' && // Preserve categories (required for backend)
          key !== 'tags' && 
          key !== 'product_attributes' && 
          key !== 'price_tax_excl' && 
          key !== 'price_tax_incl' && 
          key !== 'price' && 
          key !== 'quantity' &&
          key !== 'attributes' && // Preserve attributes (backend requires this format)
          key !== 'product_attributes' && // Preserve product_attributes for compatibility
          key !== 'description' && // Preserve description
          key !== 'meta' && // Preserve meta object
          key !== 'meta_title' && // Preserve SEO fields (for compatibility)
          key !== 'meta_description' &&
          key !== 'meta_keywords' &&
          key !== 'delivery_slots' && // Preserve delivery fields
          key !== 'store_postcode') {
        delete transformed[key];
      }
    });
    
    // Ensure categories is always an array (even if empty)
    if (!Array.isArray(transformed.categories)) {
      transformed.categories = [];
    }
    
    // Ensure description is always a string (even if empty)
    if (typeof transformed.description !== 'string') {
      transformed.description = transformed.description?.toString() || '';
    }
    
    // Ensure SEO fields are always strings (even if empty)
    if (typeof transformed.meta_title !== 'string') {
      transformed.meta_title = transformed.meta_title?.toString() || '';
    }
    if (typeof transformed.meta_description !== 'string') {
      transformed.meta_description = transformed.meta_description?.toString() || '';
    }
    
    // Ensure delivery fields are always strings (even if empty)
    if (typeof transformed.delivery_slots !== 'string') {
      transformed.delivery_slots = transformed.delivery_slots?.toString() || '';
    }
    if (typeof transformed.store_postcode !== 'string') {
      transformed.store_postcode = transformed.store_postcode?.toString() || '';
    }
    
    console.log('Final transformed data - variants field:', transformed.variants, 'length:', transformed.variants.length);
    if (transformed.variants.length > 0) {
      console.log('Final transformed data - First variant details:', {
        name: transformed.variants[0].name,
        sku: transformed.variants[0].sku,
        price: transformed.variants[0].price,
        qty: transformed.variants[0].qty,
        manage_stock: transformed.variants[0].manage_stock,
        in_stock: transformed.variants[0].in_stock,
        is_active: transformed.variants[0].is_active,
        uid: transformed.variants[0].uid,
        hasAllRequiredFields: !!(transformed.variants[0].name && transformed.variants[0].sku && transformed.variants[0].price !== undefined)
      });
    }
    console.log('Final transformed data - extraFields:', transformed.extraFields);
    console.log('Final transformed data - categories:', transformed.categories, 'length:', transformed.categories?.length);
    console.log('Final transformed data - tags:', transformed.tags, 'length:', transformed.tags?.length);
    console.log('Final transformed data - attributes:', transformed.attributes, 'length:', transformed.attributes?.length);
    console.log('Final transformed data - product_attributes:', transformed.product_attributes, 'length:', transformed.product_attributes?.length);
    console.log('Final transformed data - price:', transformed.price, 'price_tax_excl:', transformed.price_tax_excl, 'quantity:', transformed.quantity);
    // Note: manage_stock and in_stock are not in products table (only in variants)
    console.log('Final transformed data - description:', transformed.description, 'length:', transformed.description?.length);
    console.log('Final transformed data - meta_title:', transformed.meta_title, 'length:', transformed.meta_title?.length);
    console.log('Final transformed data - meta_description:', transformed.meta_description, 'length:', transformed.meta_description?.length);
    console.log('Final transformed data - delivery_slots:', transformed.delivery_slots);
    console.log('Final transformed data - store_postcode:', transformed.store_postcode);
    console.log('Transformed data keys:', Object.keys(transformed));
    
    return transformed;
  }

  /** ✅ Save handler */
  function handleSaveProduct() {
    let values = getValues() as EcommerceProduct;
    
    // Ensure product_variants exists before transforming (defensive check)
    if (!values.product_variants || !Array.isArray(values.product_variants)) {
      console.log('product_variants missing or not array, setting to empty array');
      setValue('product_variants', [], { shouldDirty: false });
      // Re-get values after setting
      values = getValues() as EcommerceProduct;
    }
    
    // Log the values before transformation to see what we're working with
    console.log('handleSaveProduct - Form values before transform:', {
      gallery_images_count: Array.isArray(values.gallery_images) ? values.gallery_images.length : 0,
      images_count: Array.isArray(values.images) ? values.images.length : 0,
      first_image_preview: Array.isArray(values.gallery_images) && values.gallery_images.length > 0
        ? {
            url_preview: values.gallery_images[0]?.url?.substring(0, 100),
            is_base64: values.gallery_images[0]?.url?.startsWith('data:image/'),
          }
        : 'no images',
    });
    
    const transformedData = transformFormValues(values);
    
    // Log the transformed data to see what's being sent
    console.log('handleSaveProduct - Transformed data images:', {
      images_count: Array.isArray(transformedData.images) ? transformedData.images.length : 0,
      gallery_images_count: Array.isArray(transformedData.gallery_images) ? transformedData.gallery_images.length : 0,
      first_image_preview: Array.isArray(transformedData.images) && transformedData.images.length > 0
        ? {
            url_preview: transformedData.images[0]?.url?.substring(0, 100),
            is_base64: transformedData.images[0]?.url?.startsWith('data:image/'),
          }
        : 'no images',
    });
    
    saveProduct(transformedData)
      .unwrap()
      .then((data) => {
        // Show success snackbar
        enqueueSnackbar(t('product_updated_successfully'), {
          variant: 'success',
        });
        
        // For existing products, force a hard reload to bypass all caching
        // This ensures updated images are displayed immediately
        if (productId && productId !== 'new') {
          // Small delay to show success message, then force hard reload
          setTimeout(() => {
            // Force hard reload by adding cache-busting parameter to URL
            const currentUrl = window.location.href;
            const separator = currentUrl.includes('?') ? '&' : '?';
            window.location.href = `${currentUrl}${separator}_reload=${Date.now()}`;
          }, 300);
        } else {
          // For new products, redirect to products page
          setTimeout(() => {
            navigate('/apps/e-commerce/products');
          }, 500);
        }
      })
      .catch((error) => {
        console.error('Error updating product:', error);
        console.error('Error object:', JSON.stringify(error, null, 2));
        
        // Extract error message from various possible locations
        let errorMessage = 'Unknown error occurred';
        
        if (error?.data) {
          // Try different possible error message locations
          errorMessage = error.data.message || 
                       error.data.error || 
                       (typeof error.data === 'string' ? error.data : null) ||
                       (error.data.errors && typeof error.data.errors === 'object' 
                         ? JSON.stringify(error.data.errors) 
                         : null) ||
                       errorMessage;
        }
        
        if (!errorMessage || errorMessage === 'Unknown error occurred') {
          errorMessage = error?.message || 
                        error?.error ||
                        `HTTP ${error?.status || 'Unknown'} Error`;
        }
        
        console.error('Full error details:', {
          status: error?.status,
          originalStatus: error?.originalStatus,
          data: error?.data,
          message: errorMessage,
          fullError: error,
        });
        
        enqueueSnackbar(
          `${t('failed_to_update_product')}: ${errorMessage}`,
          { variant: 'error', autoHideDuration: 8000 }
        );
      });
  }

  /** ✅ Create handler */
  function handleCreateProduct() {
    let values = getValues() as EcommerceProduct;
    
    // Ensure product_variants exists before transforming (defensive check)
    if (!values.product_variants || !Array.isArray(values.product_variants)) {
      console.log('product_variants missing or not array, setting to empty array');
      setValue('product_variants', [], { shouldDirty: false });
      // Re-get values after setting
      values = getValues() as EcommerceProduct;
    }
    
    // Debug: Log current form values
    console.log('Creating product with values:', {
      store_id: values.store_id,
      session_store_id: sessionStoreId,
      name: values.name,
      description: values.description,
      main_category: values.main_category,
      subcategory: values.subcategory,
      gallery_images: values.gallery_images?.length,
    });
    
    // Check store_id first (critical for suppliers/vendors)
    // If form doesn't have store_id but session does, set it from session and continue
    if (!values.store_id && sessionStoreId) {
      console.log('⚠️ Form missing store_id, setting from session:', sessionStoreId);
      const numericStoreId = Number(sessionStoreId);
      if (!isNaN(numericStoreId) && numericStoreId > 0) {
        methods.setValue('store_id', numericStoreId, { shouldValidate: true });
        // Update values object to use the new store_id
        values.store_id = numericStoreId;
        console.log('✅ Store ID set from session, continuing with creation');
      }
    }
    
    if (!values.store_id) {
      console.error('❌ Store ID is missing! Form values:', values, 'Session store_id:', sessionStoreId);
      const userRole = Array.isArray(userRoles) ? userRoles[0] : userRoles;
      const roleName = userRole === 'supplier' ? 'supplier' : userRole === 'vendor' ? 'vendor' : 'user';
      enqueueSnackbar(
        `Store is required. Please create a store first by going to "My Store" in the sidebar, or refresh the page to reload your store information.`,
        { variant: 'error', autoHideDuration: 10000 }
      );
      return;
    }
    
    // Check if this is a draft save - drafts have relaxed validation
    const isDraft = values.status === 'draft';
    setIsDraftSave(isDraft); // Track if this is a draft save
    
    // For drafts, only validate essential fields: name and category
    if (isDraft) {
      if (!values.name || values.name.length < 5) {
        enqueueSnackbar('Product name is required (minimum 5 characters)', { variant: 'error' });
        return;
      }
      if (!values.main_category || !values.main_category.id) {
        enqueueSnackbar('Main category is required', { variant: 'error' });
        return;
      }
      // Subcategory is now optional, so no validation needed
      // Skip other validations for drafts - allow saving without images/description
    } else {
      // Full validation for published products
      methods.trigger().then((isFormValid) => {
        if (!isFormValid) {
          const errors = methods.formState.errors;
          console.error('Form validation errors:', errors);
          
          // Check for store_id error specifically
          if (errors.store_id) {
            enqueueSnackbar(
              errors.store_id.message || 'Store is required. You must have a store before creating products.',
              { variant: 'error', autoHideDuration: 6000 }
            );
            return;
          }
          
          // Show first validation error
          const firstError = Object.values(errors)[0];
          if (firstError) {
            enqueueSnackbar(
              firstError.message || t('please_fill_all_required_fields'),
              { variant: 'error' }
            );
          } else {
            enqueueSnackbar(t('please_fill_all_required_fields'), { variant: 'error' });
          }
          return;
        }
        
        proceedWithSave(values);
      });
      return;
    }
    
    // For drafts, proceed directly without full validation
    proceedWithSave(values);
  }
  
  function proceedWithSave(values: EcommerceProduct) {

      const transformedData = transformFormValues(values);
      console.log('Sending product data to API:', transformedData);
      console.log('Variants being sent:', transformedData.variants);
      
      createProduct(transformedData)
        .unwrap()
        .then((data) => {
          console.log('Product created successfully:', data);
          console.log('Full response data:', JSON.stringify(data, null, 2));
          
          // Try different possible response structures
          const productId = data?.data?.id || data?.data?.product?.id || data?.id || data?.product_id;
          
          if (!productId) {
            console.error('No product ID in response:', data);
            enqueueSnackbar('Product created but ID not found in response. Check console for details.', { 
              variant: 'warning',
              autoHideDuration: 8000
            });
            return;
          }
          
          console.log('Extracted product ID:', productId);
          
          setCreatedProductId(String(productId));
          setSuccessDialogOpen(true);
          enqueueSnackbar(t('product_created_successfully'), {
            variant: 'success',
          });
        })
        .catch((error) => {
          console.error('Error creating product:', error);
          console.error('Error status:', error.status);
          console.error('Error data:', error.data);
          
          // Handle different error types
          let errorMessage = t('failed_to_create_product');
          const errorDetails: string[] = [];
          
          if (error.data) {
            if (error.data.message) {
              errorMessage = error.data.message;
            } else if (error.data.error) {
              errorMessage = error.data.error;
            } else if (error.data.errors) {
              // Laravel validation errors - show all errors
              console.error('Validation errors:', error.data.errors);
              const errors = error.data.errors;
              Object.keys(errors).forEach((field) => {
                const fieldErrors = errors[field];
                if (Array.isArray(fieldErrors)) {
                  fieldErrors.forEach((err: string) => {
                    errorDetails.push(`${field}: ${err}`);
                  });
                } else {
                  errorDetails.push(`${field}: ${fieldErrors}`);
                }
              });
              
              // Show first error as main message, all errors in console
              if (errorDetails.length > 0) {
                errorMessage = errorDetails[0];
                console.error('All validation errors:', errorDetails);
              }
            }
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          // Show error message with details if available
          if (errorDetails.length > 1) {
            enqueueSnackbar(`${errorMessage} (${errorDetails.length} errors - check console)`, { 
              variant: 'error',
              autoHideDuration: 8000
            });
          } else {
            enqueueSnackbar(errorMessage, { variant: 'error', autoHideDuration: 6000 });
          }
        });
  }

  /** ✅ Remove confirm handler */
  function handleRemoveConfirmed() {
    removeProduct(productId)
      .unwrap()
      .then(() => {
        enqueueSnackbar(t('product_deleted_successfully'), {
          variant: 'success',
        });
        navigate('/apps/e-commerce/products');
      })
      .catch((error) => {
        console.error('Error deleting product:', error.data?.error);
        enqueueSnackbar(
          `${t('failed_to_delete_product')} ${error.data?.error ?? ''}`,
          { variant: 'error' }
        );
      })
      .finally(() => setConfirmDialogOpen(false));
  }

  /** ✅ Success dialog close (redirect after action) - Only used for create flow */
  function handleCloseDialog() {
    setSuccessDialogOpen(false);
    
    // For draft saves, redirect to products page
    if (isDraftSave) {
      console.log('Draft saved, redirecting to products page');
      setIsDraftSave(false); // Reset draft flag
      // Redirect to products list page
      setTimeout(() => {
        navigate('/apps/e-commerce/products');
      }, 500); // Small delay to show success message
      return;
    }
    
    // For published products, navigate normally
    if (createdProductId) {
      console.log('Navigating to product:', createdProductId);
      
      // Add a small delay to ensure product is available in backend
      setTimeout(() => {
        // Check if we're on the listing route - if so, navigate to listing route
        const currentPath = window.location.pathname;
        if (currentPath.includes('/listing/')) {
          // Stay on listing route but update to the new product ID
          console.log('Navigating to listing route:', `/listing/${createdProductId}`);
          navigate(`/listing/${createdProductId}`, { replace: true });
        } else {
          // Navigate to the product edit page in the main app
          console.log('Navigating to product edit page:', `/apps/e-commerce/products/${createdProductId}`);
          navigate(`/apps/e-commerce/products/${createdProductId}`);
        }
      }, 500); // 500ms delay to allow backend to process
    } else {
      // If no product ID, just go to products list
      const currentPath = window.location.pathname;
      if (currentPath.includes('/listing/')) {
        // Stay on listing route for new product
        navigate('/listing/new', { replace: true });
      } else {
        navigate('/apps/e-commerce/products');
      }
    }
  }

  const handleBack = () => {
    // Check if we're on the listing route
    const currentPath = window.location.pathname;
    if (currentPath.includes('/listing/')) {
      navigate('/listing');
    } else {
      navigate('/apps/e-commerce/products');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row flex-1 w-full items-center justify-between space-y-2 sm:space-y-0 py-6 sm:py-8">
      {/* Left section */}
      <div className="flex flex-col items-start space-y-2 sm:space-y-0 w-full sm:max-w-full min-w-0">
        <motion.div
          className="flex items-center space-x-3 mb-2"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1, transition: { delay: 0.3 } }}
        >
          <Button
            className="min-w-0 px-2 sm:px-3"
            variant="outlined"
            color="inherit"
            onClick={handleBack}
            startIcon={
              <FuseSvgIcon size={20}>
                heroicons-outline:arrow-left
              </FuseSvgIcon>
            }
            sx={{
              textTransform: 'none',
              borderRadius: 2,
            }}
          >
            <span className="hidden sm:inline">{t('back') || 'Back'}</span>
          </Button>
          <PageBreadcrumb />
        </motion.div>

        <div className="flex items-center max-w-full space-x-3">
          <motion.div
            className="hidden sm:flex"
            initial={{ scale: 0 }}
            animate={{ scale: 1, transition: { delay: 0.3 } }}
          >
            {Array.isArray(gallery_images) && gallery_images.length > 0 ? (
              <img
                className="w-8 sm:w-12 rounded-sm"
                src={
                  (Array.isArray(gallery_images) ? gallery_images.find((img: any) => img && img.is_featured) : null)?.url ??
                  '/assets/images/apps/ecommerce/product-image-placeholder.png'
                }
                alt={name}
              />
            ) : (
              <img
                className="w-8 sm:w-12 rounded-sm"
                src="/assets/images/apps/ecommerce/product-image-placeholder.png"
                alt={name}
              />
            )}
          </motion.div>
          <motion.div
            className="flex flex-col min-w-0"
            initial={{ x: -20 }}
            animate={{ x: 0, transition: { delay: 0.3 } }}
          >
            <Typography className="text-lg sm:text-2xl truncate font-semibold">
              {name || t('new_product')}
            </Typography>
            <Typography variant="caption" className="font-medium">
              {t('product_detail')}
            </Typography>
          </motion.div>
        </div>
      </div>

      {/* Right buttons */}
      <motion.div
        className="flex flex-1 w-full"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0, transition: { delay: 0.3 } }}
      >
        {productId !== 'new' ? (
          <>
            <Button
              className="whitespace-nowrap mx-1"
              variant="contained"
              color="secondary"
              onClick={() => setConfirmDialogOpen(true)} // ✅ use confirmDialogOpen
              startIcon={
                <FuseSvgIcon className="hidden sm:flex">
                  heroicons-outline:trash
                </FuseSvgIcon>
              }
            >
              {t('remove')}
            </Button>
            <Button
              className="whitespace-nowrap mx-1"
              variant="contained"
              color="secondary"
              disabled={_.isEmpty(dirtyFields) || !isValid || isSaving}
              onClick={handleSaveProduct}
              data-product-save-button
            >
              {isSaving ? t('saving') : t('save')}
            </Button>
          </>
        ) : (
          <Button
            className="whitespace-nowrap mx-1"
            variant="contained"
            color="secondary"
            disabled={isCreating} // Only disable when actually creating
            onClick={handleCreateProduct}
            data-product-create-button
            title={!isValid ? 'Please fill all required fields (Name, Description, Category, Subcategory, Images)' : ''}
            sx={{
              // Force button to always be enabled and visible (except when creating)
              opacity: isCreating ? 0.6 : 1,
              pointerEvents: isCreating ? 'none' : 'auto',
              cursor: isCreating ? 'wait' : 'pointer',
              // Override Material-UI disabled styles - ensure button looks enabled when not creating
              '&.Mui-disabled': {
                opacity: isCreating ? 0.6 : 1, // Only show disabled opacity when actually creating
                cursor: isCreating ? 'wait' : 'pointer', // Always clickable when not creating
                backgroundColor: isCreating ? undefined : 'var(--mui-palette-secondary-main) !important',
                color: isCreating ? undefined : 'var(--mui-palette-secondary-contrastText) !important',
              },
              // Normal enabled state styling
              backgroundColor: 'var(--mui-palette-secondary-main)',
              color: 'var(--mui-palette-secondary-contrastText)',
              '&:hover:not(:disabled)': {
                backgroundColor: 'var(--mui-palette-secondary-dark)',
              },
              '&:active:not(:disabled)': {
                backgroundColor: 'var(--mui-palette-secondary-dark)',
              }
            }}
          >
            {isCreating ? t('adding') : t('add')}
          </Button>
        )}
      </motion.div>

      {/* ✅ Dialogs - Only show success dialog for create flow, not update */}
      {productId === 'new' && (
        <SuccessDialog
          open={successDialogOpen}
          onClose={handleCloseDialog}
          message={t('your_product_has_been_created')}
        />
      )}

      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleRemoveConfirmed}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default ProductHeader;
