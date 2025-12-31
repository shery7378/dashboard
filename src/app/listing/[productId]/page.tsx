'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormProvider } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import MultiKonnectListingCreation from '../../(control-panel)/apps/e-commerce/products/[productId]/[[...handle]]/MultiKonnectListingCreation';
import ProductModel from '../../(control-panel)/apps/e-commerce/products/models/ProductModel';
import AuthGuard from '@auth/AuthGuard';
import authRoles from '@auth/authRoles';

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
				url: z.string().nonempty('Image URL is required'),
				is_featured: z.boolean().optional(),
			})
		)
		.min(1, 'At least one image is required'),
});

/**
 * Standalone listing creation page without header and sidebar
 */
function StandaloneListingPage() {
	const { productId } = useParams<{ productId: string }>();
	const { data: session } = useSession();
	const sessionStoreId = session?.db?.store_id;

	const methods = useForm({
		mode: 'onBlur',
		defaultValues: ProductModel({}),
		resolver: zodResolver(schema),
		criteriaMode: 'all',
	});

	const { reset, setValue, watch } = methods;

	// Initialize form with store_id from session
	useEffect(() => {
		const defaultValues = ProductModel({});
		if (sessionStoreId) {
			defaultValues.store_id = Number(sessionStoreId);
		}
		// Ensure product_variants is always initialized (backend requires this field)
		if (!defaultValues.product_variants) {
			defaultValues.product_variants = [];
		}
		// Ensure delivery_slots is initialized (for same-day delivery validation)
		if (!defaultValues.delivery_slots) {
			defaultValues.delivery_slots = '12-3pm';
		}
		reset(defaultValues);
	}, [reset, sessionStoreId]);

	// Also set store_id immediately if session has it and form doesn't
	useEffect(() => {
		if (sessionStoreId && !watch('store_id')) {
			const numericStoreId = Number(sessionStoreId);
			if (!isNaN(numericStoreId) && numericStoreId > 0) {
				setValue('store_id', numericStoreId, { shouldValidate: true });
			}
		}
	}, [sessionStoreId, watch, setValue]);

	return (
		<AuthGuard from="addProduct" auth={[...authRoles.vendor, ...authRoles.supplier]}>
			<FormProvider {...methods}>
				<MultiKonnectListingCreation />
			</FormProvider>
		</AuthGuard>
	);
}

export default StandaloneListingPage;

