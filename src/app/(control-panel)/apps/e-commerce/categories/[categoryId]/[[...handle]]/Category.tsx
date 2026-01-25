'use client';

import FuseLoading from '@fuse/core/FuseLoading';
import FusePageCarded from '@fuse/core/FusePageCarded';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { motion } from 'motion/react';
import { SyntheticEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from '@fuse/core/Link';
import { FormProvider, useForm } from 'react-hook-form';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FuseTabs from 'src/components/tabs/FuseTabs';
import FuseTab from 'src/components/tabs/FuseTab';
import CategoryHeader from './CategoryHeader';
import BasicInfoTab from './tabs/BasicInfoTab';
import CategoryImagesTab from './tabs/CategoryImagesTab';
import CategorySeoTab from './tabs/CategorySeoTab';
import { useGetECommerceCategoryQuery } from '../../../apis/CategoriesLaravelApi';
import { createDefaultCategory, slugify } from '../../models/CategoryModel';
import { sanitizeCategory } from '../../models/sanitizeCategory';

// ✅ Form validation schema
const schema = z
	.object({
		name: z
			.string()
			.nonempty("You must enter a category name")
			.min(5, "The category name must be at least 5 characters"),
		slug: z.string().optional(),
		description: z.string().optional(),

		category_type: z.enum(["parent", "child"], {
			required_error: "Category type is required",
		}),

		parent_id: z.number().nullable().optional(),
		active: z.number().min(0).max(1).default(0),

		meta_title: z.string().max(60, "Meta title should be under 60 characters").optional(),
		meta_description: z.string().max(160, "Meta description should be under 160 characters").optional(),
		meta_keywords: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		if (data.category_type === "child" && !data.parent_id) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Parent category is required for child categories",
				path: ["parent_id"],
			});
		}
	});

function Category() {
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
	const routeParams = useParams<{ categoryId: string }>();
	const { categoryId } = routeParams;

	const {
		data: category,
		isLoading,
		isError
	} = useGetECommerceCategoryQuery(categoryId, {
		skip: !categoryId || categoryId === 'new'
	});

	const initialCategoryType =
		categoryId === 'new'
			? 'child'
			: category?.data?.parent_id === null
				? 'parent'
				: 'child';

	const [tabValue, setTabValue] = useState('basic-info');

	const methods = useForm({
		mode: 'onChange',
		shouldUnregister: false,
		defaultValues: {
			...{
				...createDefaultCategory(),
				parent_id: createDefaultCategory().parent_id !== null
					? Number(createDefaultCategory().parent_id)
					: null,
			},
			// category_type: "child", // ✅ default child
			// parent_id: null,
		},
		resolver: zodResolver(schema),
	});

	const { reset, watch, setValue } = methods;
	const form = watch();
	const name = watch('name');

	// 🧠 Reset form on category change
	useEffect(() => {
		if (categoryId === 'new') {
			methods.reset({
				...createDefaultCategory(),
				category_type: "child",
				parent_id: null,
			});
			setTimeout(() => methods.trigger(), 0); // ✅ Microtask delay for validation
		} else if (category?.data) {
			const sanitized = sanitizeCategory(category.data);
			methods.reset({
				...sanitized,
				parent_id: sanitized.parent_id !== null && sanitized.parent_id !== undefined
					? Number(sanitized.parent_id)
					: null,
			});
			setTimeout(() => methods.trigger(), 0); // ✅ Microtask delay for validation
		}
	}, [category, categoryId, methods]);

	if (process.env.NODE_ENV === 'development') {
		// console.log('📦 categoryId:', categoryId);
		// console.log('🌀 category:', category);
		// console.log('📝 form:', form);
	}

	// Only show loading if we're actually loading an existing category (not creating new)
	if (isLoading && categoryId !== 'new') {
		return <FuseLoading />;
	}

	if (isError && categoryId !== 'new') {
		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1, transition: { delay: 0.1 } }}
				className="flex flex-col flex-1 items-center justify-center h-full"
			>
				<Typography color="text.secondary" variant="h5">
					There is no such category!
				</Typography>
				<Button
					className="mt-6"
					component={Link}
					variant="outlined"
					to="/apps/e-commerce/categories"
					color="inherit"
				>
					Go to Categories Page
				</Button>
			</motion.div>
		);
	}

	return (
		<FormProvider {...methods}>
			<FusePageCarded
				header={<CategoryHeader />}
				content={
					<div className="p-4 sm:p-6 max-w-5xl space-y-6">
						<FuseTabs value={tabValue} onChange={(e: SyntheticEvent, val: string) => setTabValue(val)}>
							<FuseTab value="basic-info" label="Basic Info" />
							<FuseTab value="category-images" label="Category Images" />
							<FuseTab value="seo-settings" label="SEO Settings" />
						</FuseTabs>

						<div>
							<div className={tabValue !== 'basic-info' ? 'hidden' : ''}>
								<BasicInfoTab initialCategoryType={initialCategoryType} category={category?.data} />
							</div>
							<div className={tabValue !== 'category-images' ? 'hidden' : ''}>
								<CategoryImagesTab />
							</div>
							<div className={tabValue !== 'seo-settings' ? 'hidden' : ''}>
								<CategorySeoTab />
							</div>
						</div>
					</div>
				}
				scroll={isMobile ? 'normal' : 'content'}
			/>
		</FormProvider>
	);
}

export default Category;
