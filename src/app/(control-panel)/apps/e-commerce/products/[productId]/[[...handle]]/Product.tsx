'use client';

import FuseLoading from '@fuse/core/FuseLoading';
import FusePageCarded from '@fuse/core/FusePageCarded';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { motion } from 'motion/react';
import { SyntheticEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from '@fuse/core/Link';
import _ from 'lodash';
import { FormProvider, useForm } from 'react-hook-form';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FuseTabs from 'src/components/tabs/FuseTabs';
import FuseTab from 'src/components/tabs/FuseTab';
import ProductHeader from './ProductHeader';
import BasicInfoTab from './tabs/BasicInfoTab';
import VariantsTab from './tabs/VariantsTab';
import InventoryTab from './tabs/InventoryTab';
import InventorySyncTab from './tabs/InventorySyncTab';
import PricingTab from './tabs/PricingTab';
import ProductImagesTab from './tabs/ProductImagesTab';
import ShippingTab from './tabs/ShippingTab';
import { useGetECommerceProductQuery } from '../../../apis/ProductsLaravelApi';
import ProductModel from '../../models/ProductModel';
import ProductSeoTab from './tabs/ProductSeoTab';
import { sanitizeProduct } from '../../models/sanitizeProduct';
import { useTranslation } from 'react-i18next';
import { useSession } from 'next-auth/react';
import MultiKonnectListingCreation from './MultiKonnectListingCreation';
import '../../i18n';

/**
 * Form Validation Schema
 */

const schema = z.object({
	store_id: z
		.number({
			required_error: 'Store is required',
			invalid_type_error: 'Store must be a number',
		})
		.int()
		.positive('Invalid store selected')
		.nullable()
		.refine((val) => val !== null, { message: 'You must select a store' }),
	name: z.string().min(5, 'The product name must be at least 5 characters').nonempty('You must enter a product name'),
	description: z
		.string()
		.min(10, 'The description must be at least 10 characters')
		.max(500, 'The description must not exceed 500 characters')
		.nonempty('You must enter a description')
		.trim(),
	main_category: z
		.object({
			id: z.union([z.string(), z.number()]).refine((val) => val !== '' && val !== null && val !== undefined, {
				message: 'Main category ID is required',
			}),
			name: z.string().optional(),
		})
		.nullable()
		.refine((val) => val !== null, { message: 'You must select a main category' }),
	subcategory: z
		.array(
			z.object({
				id: z.union([z.string(), z.number()]).refine((val) => val !== '' && val !== null && val !== undefined, {
					message: 'Subcategory ID is required',
				}),
				name: z.string().optional(),
			})
		)
		.nonempty('You must select at least one subcategory'),
	gallery_images: z
		.array(
			z.object({
				url: z.string().min(1, 'Image URL is required'),
				is_featured: z.boolean().optional(),
			})
		)
		.min(1, 'At least one image is required'),
	// price_tax_excl: z
	// 	.number({
	// 		required_error: 'Price is required',
	// 		invalid_type_error: 'Price must be a number',
	// 	})
	// 	.positive('Price must be greater than 0'),
});

/**
 * The product page.
 */
function Product() {
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
	const { t } = useTranslation('products');

	const routeParams = useParams<{ productId: string; handle?: string[] }>();

	// Extract productId from route params - handle might be an array if slug is present
	// In Next.js, with route [productId]/[[...handle]], productId should be the first segment
	let productId = routeParams.productId;
	
	// If handle exists and productId looks like it might be part of handle, extract correctly
	// This handles edge cases where the route might be malformed
	if (routeParams.handle && Array.isArray(routeParams.handle) && routeParams.handle.length > 0) {
		// If productId is actually a slug (not numeric), we might need to handle differently
		// But typically productId should be numeric
		// Only log in development to avoid console noise
		if (process.env.NODE_ENV === 'development') {
			console.log('Route has handle segments:', routeParams.handle);
		}
		// Ensure productId is extracted correctly - if handle contains the actual ID, use it
		// Otherwise, productId from routeParams should be correct
	}

	// Ensure productId is a string and extract just the ID part (in case it includes slug)
	// The productId should be numeric, so extract just the numeric part
	const numericId = productId ? String(productId).split('/')[0] : '';
	productId = numericId || productId;

	// Debug: Log route params to understand the structure
	console.log('Product route params:', { 
		originalProductId: routeParams.productId, 
		extractedProductId: productId,
		handle: routeParams.handle,
		fullParams: routeParams 
	});

	const {
		data: product,
		isLoading,
		isError,
		error,
		refetch
	} = useGetECommerceProductQuery(productId, {
		skip: !productId || productId === 'new' || productId === ''
	});

	// Debug: Log API query state
	if (productId && productId !== 'new') {
		console.log('Product query state:', { 
			productId, 
			isLoading, 
			isError, 
			hasData: !!product,
			productData: product?.data ? { id: product.data.id, name: product.data.name } : null,
			error: error ? {
				status: (error as any)?.status,
				data: (error as any)?.data,
				message: (error as any)?.message || (error as any)?.error,
				originalStatus: (error as any)?.originalStatus
			} : null,
			apiUrl: `/api/products/${productId}`,
			fullResponse: product
		});
		
		// If we get a 404, try to get more details
		if (isError && error) {
			const errorStatus = (error as any)?.status || (error as any)?.originalStatus;
			if (errorStatus === 404) {
				console.error('Product 404 - Possible reasons:', {
					productId,
					productIdType: typeof productId,
					productIdNumeric: isNaN(Number(productId)) ? 'Not numeric' : Number(productId),
					errorData: (error as any)?.data,
					suggestion: 'Product might not exist, be inactive, or require authentication'
				});
			}
		}
	}

	const [tabValue, setTabValue] = useState('basic-info');

	const methods = useForm({
		mode: 'onBlur', // Changed from 'onChange' to 'onBlur' - validates on blur instead of on every change
		defaultValues: ProductModel({}),
		resolver: zodResolver(schema),
		criteriaMode: 'all', // Show all validation errors
	});

	const { reset, watch, setValue } = methods;

	const form = watch();

	// Get session to set store_id for new products
	const { data: session } = useSession();
	const sessionStoreId = session?.db?.store_id;
	
	// Check if user is vendor or supplier
	const user = session?.user || session?.db;
	const userRoles = user?.role || session?.db?.role || [];
	const roles = Array.isArray(userRoles) ? userRoles : [userRoles];
	const isVendor = roles.includes('vendor');
	const isSupplier = roles.includes('supplier');
	const isVendorOrSupplier = isVendor || isSupplier;

	useEffect(() => {
		if (productId === 'new') {
			const defaultValues = ProductModel({});
			// Set store_id from session if available
			if (sessionStoreId) {
				defaultValues.store_id = Number(sessionStoreId);
				console.log('✅ Setting store_id in Product.tsx from session:', sessionStoreId);
			}
			reset(defaultValues);
		} else if (product) {
			console.log(product.data, 'product');
			reset(sanitizeProduct(product.data)); // ✅ wrap with ProductModel
		}
	}, [product, productId, reset, sessionStoreId]);

	// Also set store_id immediately if session has it and form doesn't
	useEffect(() => {
		if (productId === 'new' && sessionStoreId && !watch('store_id')) {
			const numericStoreId = Number(sessionStoreId);
			if (!isNaN(numericStoreId) && numericStoreId > 0) {
				console.log('✅ Setting store_id immediately in Product.tsx:', numericStoreId);
				setValue('store_id', numericStoreId, { shouldValidate: true });
			}
		}
	}, [productId, sessionStoreId, watch, setValue]);

	// useEffect(() => {
	// 	if (product) {
	// 		reset({ ...product });
	// 	}
	// }, [product, reset]);

	/**
	 * Tab Change
	 */
	function handleTabChange(event: SyntheticEvent, value: string) {
		setTabValue(value);
	}

	if (isLoading) {
		// console.log('first loading');
		return <FuseLoading />;
	}

	/**
	 * Show Message if the requested products is not exists
	*/
	if (isError && productId !== 'new') {
		const errorStatus = (error as any)?.status || (error as any)?.originalStatus;
		const errorData = (error as any)?.data;
		const errorMessage = errorData?.message || (error as any)?.message || (error as any)?.error || 'Unknown error';
		
		console.error('Product not found error:', {
			productId,
			errorStatus,
			errorData,
			errorMessage,
			apiUrl: `/api/products/${productId}`,
			fullError: error
		});
		
		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1, transition: { delay: 0.1 } }}
				className="flex flex-col flex-1 items-center justify-center h-full space-y-4"
			>
				<Typography
					color="text.secondary"
					variant="h5"
				>
					Product not found!
				</Typography>
				<Typography
					color="text.secondary"
					variant="body2"
					className="text-center max-w-md"
				>
					Product ID: {productId}<br />
					API URL: /api/products/{productId}<br />
					{errorStatus && `HTTP Status: ${errorStatus}`}<br />
					{errorMessage && `Error: ${errorMessage}`}
					<br /><br />
					<strong>Possible reasons:</strong><br />
					• Product doesn't exist in database<br />
					• Product is inactive (check active status)<br />
					• Authentication/authorization issue<br />
					• Product belongs to different store
				</Typography>
				<div className="flex gap-2 mt-4">
					<Button
						variant="outlined"
						onClick={() => refetch()}
						color="primary"
					>
						Retry
					</Button>
					<Button
						component={Link}
						variant="outlined"
						to="/apps/e-commerce/products"
						color="inherit"
					>
						Go to Products Page
					</Button>
				</div>
			</motion.div>
		);
	}

	/**
	 * Wait while product data is loading and form is setted
	*/
	// console.log('before second loading');
	if (_.isEmpty(form) || (product && routeParams.productId !== product.data.id && routeParams.productId !== 'new')) {
		// console.log('second loading');
		// return <FuseLoading />;
	}

	// Show MultiKonnect listing creation interface for vendors/suppliers (both new and edit)
	if (isVendorOrSupplier) {
		return (
			<FormProvider {...methods}>
				<MultiKonnectListingCreation />
			</FormProvider>
		);
	}

	return (
		<FormProvider {...methods}>
			<FusePageCarded
				header={<ProductHeader />}
				content={
					<div className="p-4 sm:p-6 max-w-5xl space-y-6">
						<FuseTabs
							value={tabValue}
							onChange={handleTabChange}
						>
							<FuseTab
								value="basic-info"
								label={t('basic_info')}
							/>
							<FuseTab
								value="product-images"
								label={t('product_images')}
							/>
							<FuseTab
								value="pricing"
								label={t('pricing')}
							/>
							<FuseTab
								value="inventory"
								label={t('inventory')}
							/>
							<FuseTab
								value="shipping"
								label={t('shipping')}
							/>
							<FuseTab value="seo-settings" label={t('seo_settings')} />

							<FuseTab value="variants" label={t('variants')} />
							<FuseTab value="inventory-sync" label="Inventory Sync" />
						</FuseTabs>
						<div className="">
							<div className={tabValue !== 'basic-info' ? 'hidden' : ''}>
								<BasicInfoTab />
							</div>

							<div className={tabValue !== 'product-images' ? 'hidden' : ''}>
								<ProductImagesTab />
							</div>

							<div className={tabValue !== 'pricing' ? 'hidden' : ''}>
								<PricingTab />
							</div>

							<div className={tabValue !== 'inventory' ? 'hidden' : ''}>
								<InventoryTab />
							</div>

							<div className={tabValue !== 'shipping' ? 'hidden' : ''}>
								<ShippingTab />
							</div>
							<div className={tabValue !== 'seo-settings' ? 'hidden' : ''}>
								<ProductSeoTab />
							</div>
							<div className={tabValue !== 'variants' ? 'hidden' : ''}>
								<VariantsTab />
							</div>
							<div className={tabValue !== 'inventory-sync' ? 'hidden' : ''}>
								<InventorySyncTab productId={productId} />
							</div>
						</div>
					</div>
				}
				scroll={isMobile ? 'normal' : 'content'}
			/>
		</FormProvider>
	);
}

export default Product;
