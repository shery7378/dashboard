import TextField from '@mui/material/TextField';
import { Controller, useFormContext } from 'react-hook-form';
import { Typography } from '@mui/material';
import { useEffect } from 'react';
import { slugify } from '../../../models/StoreModel';

/**
 * Store basic info form tab (name, slug, description)
 */
function StoreBasicInfoTab() {
	const { control, setValue, formState, watch } = useFormContext();
	const { errors } = formState;

	const slug = watch('slug');
	const storeId = watch('id');
	const name = watch('name');

	useEffect(() => {
		const defaultSlug = formState.defaultValues?.slug;

		if (storeId && name === formState.defaultValues?.name) {
			// Edit mode: name unchanged → use DB slug
			setValue('slug', defaultSlug);
		} else if (name) {
			// Name changed → generate new slug
			const newSlug = slugify(name);
			setValue('slug', newSlug, { shouldValidate: true });
		}
	}, [name, storeId, setValue, formState.defaultValues]);

	return (
		<div>
			{/* Store Name */}
			<Controller
				name="name"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mt-2 mb-2"
						required
						label="Store Name"
						autoFocus
						id="name"
						variant="outlined"
						fullWidth
						error={!!errors.name}
						helperText={errors?.name?.message as string}
					/>
				)}
			/>

			{/* Display Slug */}
			{slug && (
				<Typography
					variant="body2"
					className="mb-4 text-gray-600"
				>
					Slug: <span className="font-mono text-sm">{slug}</span>
				</Typography>
			)}

			{/* Hidden Slug */}
			<Controller
				name="slug"
				control={control}
				render={({ field }) => (
					<input
						type="hidden"
						{...field}
					/>
				)}
			/>

			{/* Description */}
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
						error={!!errors.description}
						helperText={errors?.description?.message as string}
					/>
				)}
			/>
		</div>
	);
}

export default StoreBasicInfoTab;
