import TextField from '@mui/material/TextField';
import { Controller, useFormContext } from 'react-hook-form';
import {
	Typography,
	CircularProgress,
	Radio,
	RadioGroup,
	FormControl,
	FormControlLabel,
	FormLabel,
	FormHelperText,
	Switch
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { useGetECommerceParentCategoriesQuery } from '../../../../apis/CategoriesLaravelApi';
import { useEffect } from 'react';
import { slugify } from '../../../models/CategoryModel';

function BasicInfoTab({
	initialCategoryType = 'child',
	category
}: {
	initialCategoryType?: 'child' | 'parent';
	category: any;
}) {
	const { control, formState, watch, setValue, trigger } = useFormContext();
	const { errors } = formState;

	const slug = watch('slug');
	const formCategoryType = watch('category_type'); // Use this for everything (form-controlled)
	const active = watch('active'); // Watch active for the switch (0 or 1)
	const name = watch('name');
	const categoryId = category?.id; // Detect edit mode
	console.log(formState, 'data formState');
	// Fetch parent categories for dropdown
	const { data: parentCategories, isLoading } = useGetECommerceParentCategoriesQuery();

	// Initial sync: Set form value on mount (runs once)
	useEffect(() => {
		setValue('category_type', initialCategoryType, { shouldValidate: true });
		setValue('active', 1, { shouldValidate: true }); // Default to active (1)

		if (initialCategoryType === 'parent') {
			setValue('parent_id', null, { shouldDirty: true, shouldValidate: true });
		}

		trigger(); // Trigger full validation after initial set
	}, [initialCategoryType, setValue, trigger]); // Only deps: runs on mount/edit load

	// Clear parent_id when switching to Parent (watches form value directly)
	useEffect(() => {
		if (formCategoryType === 'parent') {
			setValue('parent_id', null, { shouldDirty: true, shouldValidate: true }); // Explicit dirty/validate
		}
	}, [formCategoryType, setValue]);

	// 🔁 Auto-update slug based on name (adapted from Product BasicInfoTab)
	useEffect(() => {
		const defaultSlug = formState.defaultValues?.slug;

		if (categoryId && name === category?.name) {
			// Edit mode: name unchanged → use DB slug
			setValue('slug', category?.slug || defaultSlug);
		} else if (name) {
			// Name changed → generate new slug
			const newSlug = slugify(name);
			setValue('slug', newSlug, { shouldValidate: true });
		}
	}, [name, categoryId, setValue, formState.defaultValues, category]);

	// RadioGroup onChange handler (direct form update, no local state)
	const handleCategoryTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newType = e.target.value as 'child' | 'parent';
		setValue('category_type', newType, { shouldDirty: true, shouldValidate: true }); // 👈 Explicit dirty/validate
		trigger(); // Force full form validation (Zod superRefine)
	};

	return (
		<div>
			{/* Radio Toggle - Now fully form-controlled, no hidden Controller */}
			<FormControl
				component="fieldset"
				className="mt-2 mb-4"
			>
				<FormLabel
					component="legend"
					className="mb-2 font-semibold"
				>
					Category Type
				</FormLabel>
				<RadioGroup
					row
					value={formCategoryType || initialCategoryType} // Use form watch (fallback to initial)
					onChange={handleCategoryTypeChange}
				>
					<FormControlLabel
						value="child"
						control={<Radio />}
						label="Child Category"
					/>
					<FormControlLabel
						value="parent"
						control={<Radio />}
						label="Parent Category"
					/>
				</RadioGroup>

				<FormHelperText className="ms-0">
					{formCategoryType === 'child'
						? 'This category will be a sub-category. Please select its parent.'
						: 'This will be a top-level category without any parent.'}
				</FormHelperText>
			</FormControl>

			{/* Show parent_id Autocomplete only if child selected */}
			{formCategoryType === 'child' && (
				<Controller
					name="parent_id"
					control={control}
					render={({ field }) => (
						<Autocomplete
							options={parentCategories?.data || []}
							loading={isLoading}
							getOptionLabel={(option) => option?.name || ''}
							value={parentCategories?.data?.find((cat) => cat.id === field.value) || null}
							onChange={(_, newValue) => {
								field.onChange(newValue ? newValue.id : null); // ✅ null, not ''
							}}
							renderInput={(params) => (
								<TextField
									{...params}
									label="Parent Category"
									variant="outlined"
									fullWidth
									required
									className="mt-2 mb-4"
									error={!!errors.parent_id}
									helperText={errors?.parent_id?.message as string}
									InputProps={{
										...params.InputProps,
										endAdornment: (
											<>
												{isLoading ? (
													<CircularProgress
														color="inherit"
														size={20}
													/>
												) : null}
												{params.InputProps.endAdornment}
											</>
										)
									}}
								/>
							)}
						/>
					)}
				/>
			)}

			{/* Name Field */}
			<Controller
				name="name"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mt-2 mb-2"
						required
						label="Name"
						autoFocus
						id="name"
						variant="outlined"
						fullWidth
						error={!!errors.name}
						helperText={errors?.name?.message as string}
					/>
				)}
			/>

			{/* Editable Slug Field */}
			<Controller
				name="slug"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mt-2 mb-4"
						label="Slug"
						id="slug"
						variant="outlined"
						fullWidth
						helperText="URL-friendly identifier (auto-generated from name, but can be edited)"
						error={!!errors.slug}
						onChange={(e) => {
							field.onChange(e);
							trigger(); // Trigger validation
						}}
					/>
				)}
			/>

			{/* Description Field */}
			<Controller
				name="description"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mt-2 mb-4"
						id="description"
						label="Description"
						type="text"
						multiline
						rows={5}
						variant="outlined"
						fullWidth
						onChange={(e) => {
							field.onChange(e);
							trigger(); // ✅ Force form validation
						}}
					/>
				)}
			/>

			{/* Active Switch*/}
			<Controller
				name="active"
				control={control}
				// defaultValue={1}
				render={({ field }) => {
					console.log('Active field value:', field.value);
					return (
						<div className="mt-6">
							<FormControlLabel
								control={
									<Switch
										checked={field.value === 1}
										onChange={(e) => field.onChange(e.target.checked ? 1 : 0)}
										color="primary"
									/>
								}
								label="Active"
							/>
							<Typography
								variant="caption"
								color="textSecondary"
								className="block mt-1"
							>
								⚠️ Before activating, make sure required fields (Name, Description, Image ,etc.) are
								filled.
							</Typography>
						</div>
					);
				}}
			/>
		</div>
	);
}

export default BasicInfoTab;
