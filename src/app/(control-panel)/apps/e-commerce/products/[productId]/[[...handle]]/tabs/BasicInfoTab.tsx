'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import { Chip, ListItem, Typography, Button } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { useGetECommerceTagsQuery } from '../../../../apis/ECommerceTagsApi';
import { useGetECommerceAttributesQuery } from '../../../../apis/ECommerceAttributesApi';
import { useGetECommerceCategoriesQuery } from '../../../../apis/CategoriesLaravelApi';
import { slugify } from '../../../models/ProductModel';
import { getContrastColor } from '@/utils/colorUtils';
import { Switch, FormControlLabel } from '@mui/material';
import { useGetECommerceStoresQuery } from '../../../../apis/StoresLaravelApi';
import { useSession } from 'next-auth/react';
import Link from '@fuse/core/Link';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

function BasicInfoTab() {
	const methods = useFormContext();
	const { control, setValue, watch, formState, reset } = methods;
	const { errors } = formState;

	const { data: session } = useSession();
	const user = session?.user || session?.db;
	const userRoles = user?.role || [];
	const isAdmin = Array.isArray(userRoles) ? userRoles.includes('admin') : userRoles === 'admin';
	const userId = user?.id || user?.user_id || session?.db?.id;
	// Check if store_id is available in user session - it's in session.db.store_id
	const userStoreId = session?.db?.store_id || user?.store_id;
	
	// console.log('User data:', { user, userId, userRoles, isAdmin });
	
	const name = watch('name');
	const slug = watch('slug');
	const storeId = watch('store_id');
	const mainCategory = watch('main_category');
	const subCategory = watch('subcategory');
	const productId = watch('id'); // Assuming 'id' is present in edit mode to detect edit vs add
	const productAttributes = watch('product_attributes') || [];

	const mainCategoryId = mainCategory?.id;

	useEffect(() => {
		const defaultSlug = formState.defaultValues?.slug;

		if (productId && name === formState.defaultValues?.name) {
			// Edit mode: name unchanged → use DB slug
			setValue('slug', defaultSlug);
		} else if (name) {
			// Name changed → generate new slug
			const newSlug = slugify(name);
			setValue('slug', newSlug, { shouldValidate: true });
		}
	}, [name, productId, setValue, formState.defaultValues]);

	// Fetch Stores data - fetch all stores (not paginated) to find user's store
	const { data: storeData, isLoading: loadingStores, refetch: refetchStores } = useGetECommerceStoresQuery({
		page: 1,
		perPage: 1000, // Fetch all stores to ensure we find the user's store
	});
	const storeOptions = storeData?.data || [];

	// Refetch stores when component mounts (in case store was just created)
	useEffect(() => {
		if (productId === 'new' && !loadingStores) {
			refetchStores();
		}
	}, [productId, refetchStores, loadingStores]);

	const filteredStores = useMemo(() => {
		if (!user || !userId) return storeOptions;
		if (isAdmin) {
			return storeOptions; // Super Admin or Admin can see all
		}
		// For sellers/vendors: filter by user_id
		return storeOptions.filter(store => {
			const storeUserId = store.user_id || store.userId;
			return storeUserId === userId || storeUserId === Number(userId);
		});
	}, [user, userId, storeOptions, isAdmin]);

	// Check if seller/vendor has a store
	const myStore = useMemo(() => {
		if (!user || !userId || isAdmin) return null;
		if (!storeOptions || storeOptions.length === 0) return null;
		
		// Try to find store by user_id (handle both string and number)
		const foundStore = storeOptions.find(store => {
			const storeUserId = store.user_id || store.userId;
			// Try multiple comparison methods
			return (
				storeUserId === userId || 
				storeUserId === Number(userId) || 
				String(storeUserId) === String(userId) ||
				Number(storeUserId) === Number(userId)
			);
		});
		
		// Debug logging
		if (productId === 'new') {
			console.log('Store detection:', {
				userId,
				userIdType: typeof userId,
				storeOptionsCount: storeOptions.length,
				storeOptions: storeOptions.map(s => ({ 
					id: s.id, 
					user_id: s.user_id, 
					userId: s.userId,
					user_id_type: typeof s.user_id,
					userId_type: typeof s.userId
				})),
				foundStore: foundStore ? { 
					id: foundStore.id, 
					user_id: foundStore.user_id,
					userId: foundStore.userId
				} : null,
			});
		}
		
		return foundStore;
	}, [user, userId, storeOptions, isAdmin, productId]);

	// Default select store for non-admin
	useEffect(() => {
		if (user && userId && !isAdmin && !loadingStores && productId === 'new') {
			const currentStoreId = watch('store_id');
			
			// Priority 1: Use store_id from user session if available (session.db.store_id)
			if (userStoreId && (!currentStoreId || currentStoreId !== userStoreId)) {
				const numericStoreId = Number(userStoreId);
				if (!isNaN(numericStoreId) && numericStoreId > 0) {
					console.log('✅ Setting store_id from user session:', numericStoreId, 'User ID:', userId);
					setValue('store_id', numericStoreId, { 
						shouldValidate: true, 
						shouldDirty: true,
						shouldTouch: true
					});
					return;
				} else {
					console.error('❌ Invalid store_id from session:', userStoreId);
				}
			}
			
			// Priority 2: Use myStore if found (fallback if session doesn't have store_id OR if userStoreId is invalid)
			// Also try myStore if currentStoreId is not set, even if userStoreId exists
			if (myStore) {
				const storeIdToSet = myStore.id || myStore.store_id;
				// Set store_id if not already set or if it's different
				if (!currentStoreId || currentStoreId !== storeIdToSet) {
					console.log('✅ Setting store_id from stores list:', storeIdToSet, 'for user:', userId, 'Store:', myStore);
					// Ensure store_id is a number
					const numericStoreId = Number(storeIdToSet);
					if (!isNaN(numericStoreId) && numericStoreId > 0) {
						setValue('store_id', numericStoreId, { 
							shouldValidate: true, 
							shouldDirty: true,
							shouldTouch: true
						}); // Set default Store id and trigger validation
						console.log('✅ Store ID set successfully:', numericStoreId);
					} else {
						console.error('❌ Invalid store ID:', storeIdToSet);
					}
				} else {
					console.log('✅ Store ID already set:', currentStoreId);
				}
			} else if (!userStoreId && !myStore) {
				// Supplier/Vendor doesn't have a store - clear store_id to trigger validation error
				console.log('⚠️ No store found for user:', userId, 'User store_id:', userStoreId, 'Available stores:', storeOptions.length);
				console.log('⚠️ User roles:', userRoles, 'Is admin:', isAdmin);
				if (!currentStoreId) {
					setValue('store_id', null, { shouldValidate: true });
				}
			}
		}
	}, [user, userId, myStore, storeOptions, setValue, watch, isAdmin, loadingStores, productId, userStoreId]);

	// Fetch data
	const { data: categoryData, isLoading: loadingCategories } = useGetECommerceCategoriesQuery();
	const categoryOptions = categoryData?.data || [];

	// Flatten children of selected main category
	const subcategoryOptions = useMemo(() => {
		const selected = subCategory || [];
		const mainChildren = mainCategory?.children || [];

		// Avoid duplicates when combining both
		const combined = [...mainChildren, ...selected].filter(
			(value, index, self) => self.findIndex(v => v.id === value.id) === index
		);

		return combined;
	}, [mainCategory, subCategory]);

	// Fetch attributes
	const { data: attributeData, isLoading: loadingAttributes } = useGetECommerceAttributesQuery(mainCategoryId, {
		skip: !mainCategoryId,
	});
	const attributeOptions = attributeData?.data || [];

	// Use ref to track if pre-fill has been done
	const didPreFill = useRef(false);

	useEffect(() => {
		if (!productId || didPreFill.current || !attributeOptions.length || !productAttributes.length) return;

		// Pre-select attributes based on product_attributes
		const baseAttrs = productAttributes.filter(attr => attr.variant_id === null);
		const preSelected = attributeOptions
			.filter(opt => baseAttrs.some(attr => attr.attribute_id === opt.id))
			.map(attr => ({ id: attr.id, name: attr.name, type: attr.type, options: attr.options, unit: attr.unit }));

		// Prepare extraFields with values from product_attributes
		const extraFields = {};
		baseAttrs.forEach(attr => {
			const match = attributeOptions.find(opt => opt.id === attr.attribute_id);
			if (match) {
				const name = match.name;
				if (name === 'Color') {
					if (!Array.isArray(extraFields[name])) extraFields[name] = [];
					extraFields[name].push(attr.attribute_value || ''); // Default to empty string if undefined
				} else {
					extraFields[name] = attr.attribute_value || '';
				}
			}
		});

		setValue('attributes', preSelected, { shouldValidate: true });
		setValue('extraFields', extraFields, { shouldValidate: true });

		didPreFill.current = true;
	}, [productId, attributeOptions, productAttributes, setValue]);

	const getOptionStyles = (option, selected) => {
		// Safeguard against undefined or non-string options
		const safeOption = typeof option === 'string' ? option : '';
		return {
			backgroundColor: selected ? 'lightblue' : safeOption.toLowerCase(),
			color: getContrastColor(safeOption.toLowerCase()),
			'&:hover': {
				backgroundColor: selected ? 'lightblue' : `${safeOption.toLowerCase()}AA`,
			},
		};
	};

	return (
		<div>
			{/* Stores */}
			{isAdmin ? (
				<Controller
					name="store_id"
					control={control}
					render={({ field: { onChange, value } }) => (
						<Autocomplete
							options={filteredStores}
							getOptionLabel={(option) => option.name}
							isOptionEqualToValue={(option, val) => option.id === (val?.id ?? val)}
							loading={loadingStores}
							value={storeOptions.find(store => store.id === value) || null}
							onChange={(event, newValue) => {
								onChange(newValue ? newValue.id : null); // only save store_id
							}}
							renderOption={(props, option) => (
								<li {...props} key={option.id}>
									{option.name}
								</li>
							)}
							renderInput={(params) => (
								<TextField
									{...params}
									label="Store"
									variant="outlined"
									required
									placeholder="Select a Store"
									className="mt-2 mb-4"
								/>
							)}
						/>
					)}
				/>
			) : (
				// ✅ Non-admin ke liye hidden store_id field + warning if no store
				<>
					<Controller
						name="store_id"
						control={control}
						render={({ field }) => (
							<input type="hidden" {...field} value={field.value ?? null} />
						)}
					/>
					{!myStore && !loadingStores && productId === 'new' && (
						<div className="mt-2 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
							<Typography variant="body1" className="text-red-800 font-semibold mb-2">
								⚠️ Store Required
							</Typography>
							<Typography variant="body2" className="text-red-700 mb-3">
								You need to create a store before you can add products. Click the button below to create your store now.
							</Typography>
							<Button
								component={Link}
								to="/apps/e-commerce/stores/new"
								variant="contained"
								color="primary"
								startIcon={<FuseSvgIcon>heroicons-outline:plus</FuseSvgIcon>}
								className="mt-2"
								onClick={() => {
									// Refetch stores after navigation (in case user creates store)
									setTimeout(() => {
										refetchStores();
									}, 2000);
								}}
							>
								Create Store Now
							</Button>
							{errors.store_id && (
								<Typography variant="body2" className="text-red-600 mt-3">
									{errors.store_id.message as string}
								</Typography>
							)}
						</div>
					)}
					{/* Debug info for sellers - can be removed later */}
					{productId === 'new' && !isAdmin && process.env.NODE_ENV === 'development' && (
						<div className="mt-2 mb-4 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs">
							<Typography variant="caption" className="text-blue-800">
								Debug: User ID: {userId}, Store ID: {storeId}, My Store: {myStore ? `Found (ID: ${myStore.id})` : 'Not found'}, Loading: {loadingStores ? 'Yes' : 'No'}, Stores Count: {storeOptions.length}
							</Typography>
							<Button
								size="small"
								variant="outlined"
								onClick={() => refetchStores()}
								className="mt-2"
							>
								Refresh Stores
							</Button>
						</div>
					)}
				</>
			)}

			<Controller
				name="name"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mt-2 mb-4"
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

			{slug && (
				<Typography variant="body2" className="mb-4 text-gray-600">
					Slug: <span className="font-mono text-sm">{slug}</span>
				</Typography>
			)}

			<Controller
				name="slug"
				control={control}
				render={({ field }) => <input type="hidden" {...field} />}
			/>

			{/* Description */}
			<Controller
				name="description"
				control={control}
				rules={{
					required: 'Description is required',
					validate: (value) =>
						value.trim().length > 0 || 'Description cannot be empty spaces',
				}}
				render={({ field }) => (
					<TextField
						{...field}
						className="mt-2 mb-4"
						id="description"
						label="Description"
						type="text"
						multiline
						required
						rows={5}
						variant="outlined"
						fullWidth
						error={!!errors.description}
						helperText={errors?.description?.message as string}
					/>
				)}
			/>

			{/* Main Category */}
			<Controller
				name="main_category"
				control={control}
				render={({ field: { onChange, value } }) => (
					<Autocomplete
						options={categoryOptions}
						getOptionLabel={(option) => option.name}
						isOptionEqualToValue={(option, val) => option.id === val?.id}
						loading={loadingCategories}
						value={value || null}
						onChange={(event, newValue) => {
							onChange(newValue);
							setValue('subcategory', null); // Reset subcategory on change
							methods.trigger('main_category');
						}}
						renderInput={(params) => (
							<TextField
								{...params}
								label="Main Category"
								variant="outlined"
								required
								placeholder="Select a main category"
								className="mt-2 mb-4"
							/>
						)}
					/>
				)}
			/>

			{/* Subcategory */}
			{mainCategory && (
				<Controller
					name="subcategory"
					control={control}
					defaultValue={[]}
					render={({ field: { onChange, value } }) => (
						<Autocomplete
							multiple
							options={subcategoryOptions}
							getOptionLabel={(option) => option.name}
							isOptionEqualToValue={(option, val) => option.id === val?.id}
							value={value || []}
							onChange={(event, newValue) => {
								onChange(newValue);
								methods.trigger('subcategory'); // Trigger validation for subcategory
							}}
							filterSelectedOptions
							renderInput={(params) => (
								<TextField
									{...params}
									label="Subcategories"
									variant="outlined"
									required
									placeholder="Select subcategories"
									className="mt-2 mb-4"
									error={!!errors.subcategory}
									helperText={errors?.subcategory?.message as string}
								/>
							)}
						/>
					)}
				/>
			)}

			{/* Tags Field */}
			<Controller
				name="tags"
				control={control}
				defaultValue={[]}
				render={({ field: { onChange, value } }) => {
					const { data: tagData, isLoading: loadingTags } = useGetECommerceTagsQuery();
					const tagOptions = tagData?.data || [];

					const normalizeTags = (tags) =>
						tags.map((tag) =>
							typeof tag === 'string' ? { name: tag } : tag
						);

					return (
						<Autocomplete
							className="mt-2 mb-4"
							multiple
							freeSolo
							options={tagOptions}
							getOptionLabel={(option) => option.name}
							isOptionEqualToValue={(option, value) => option.name === value.name}
							loading={loadingTags}
							value={value || []}
							onChange={(event, newValue) => {
								onChange(normalizeTags(newValue));
							}}
							filterSelectedOptions
							renderInput={(params) => {
								const handleKeyDown = (event) => {
									if (event.key === 'Enter') {
										event.preventDefault();
										const input = event.target.value?.trim();
										if (input && !value.some((v) => v.name === input)) {
											const updated = [...value, { name: input }];
											onChange(updated);
										}
									}
								};

								return (
									<TextField
										{...params}
										placeholder="Select or add tags"
										label="Tags"
										variant="outlined"
										onKeyDown={handleKeyDown}
										InputLabelProps={{
											shrink: true,
										}}
										InputProps={{
											...params.InputProps,
											endAdornment: (
												<>
													{loadingTags ? <CircularProgress color="inherit" size={20} /> : null}
													{params.InputProps.endAdornment}
												</>
											),
										}}
									/>
								);
							}}
						/>
					);
				}}
			/>

			{/* Extra Fields Section */}
			<div className="mt-8 relative">
				<div className="absolute top-0 left-1/80 transform -translate-x-1/80 -translate-y-1/2 px-1">
					<Typography variant="h6" className="text-gray-800 font-semibold">
						Extra Fields
					</Typography>
				</div>
				<div className="pt-6 p-5 bg-gray-50 rounded-lg shadow-sm">
					<Controller
						name="attributes"
						control={control}
						render={({ field: { onChange, value } }) => {
							const { data: attributeData, isLoading: loadingAttributes } = useGetECommerceAttributesQuery(mainCategoryId, {
								skip: !mainCategoryId,
							});
							const attributeOptions = attributeData?.data || [];

							// Handle dynamic fields state
							const [dynamicFields, setDynamicFields] = useState([]);

							useEffect(() => {
								// Sync selected attributes with dynamic fields
								if (value && Array.isArray(value)) {
									const newFields = value.map((attr) => {
										let options = [];

										// Safely parse and validate options
										if (attr.type === 'select') {
											try {
												if (Array.isArray(attr.options)) {
													options = attr.options.filter(opt => typeof opt === 'string');
												} else if (typeof attr.options === 'string') {
													const parsed = JSON.parse(attr.options);
													if (Array.isArray(parsed)) {
														options = parsed.filter(opt => typeof opt === 'string');
													} else {
														console.warn('Parsed options is not an array:', parsed);
													}
												}
											} catch (e) {
												console.warn('Failed to parse options JSON:', attr.options, e);
											}
										}

										return {
											name: attr.name,
											type: attr.type === 'select' ? 'select' : 'number',
											value: '',
											options: options.length ? options : [], // Default to empty array if no valid options
											id: attr.id,
											unit: attr.unit || '',
										};
									});

									setDynamicFields(newFields);
								} else {
									setDynamicFields([]);
								}
							}, [value]);

							const handleRemoveField = (idToRemove) => {
								setDynamicFields((prev) => prev.filter((field) => field.id !== idToRemove));
								onChange(value.filter((attr) => attr.id !== idToRemove));
								const fieldToRemove = value.find(attr => attr.id === idToRemove);
								if (fieldToRemove) {
									setValue(`extraFields.${fieldToRemove.name}`, undefined, { shouldValidate: true });
								}
							};

							return (
								<div>
									<Autocomplete
										multiple
										className="mt-2 mb-4"
										options={attributeOptions}
										getOptionLabel={(option) => option.name || ""}
										isOptionEqualToValue={(option, val) => option.id === val?.id}
										loading={loadingAttributes}
										value={value || []}
										onChange={(event, newValue) => onChange(newValue)}
										renderInput={(params) => (
											<TextField
												{...params}
												label="Select Attributes"
												variant="outlined"
												placeholder="Select attributes"
												InputProps={{
													...params.InputProps,
													endAdornment: (
														<>
															{loadingAttributes ? <CircularProgress color="inherit" size={20} /> : null}
															{params.InputProps.endAdornment}
														</>
													),
												}}
											/>
										)}
									/>
									{dynamicFields.map((field) => (
										<div key={field.id} className="mt-4 flex items-center">
											<Controller
												name={`extraFields.${field.name}`}
												control={control}
												defaultValue=""
												render={({ field: fieldProps }) => (
													<div className="flex-1">
														{field.type === 'select' && field.name === 'Color' ? (
															<Autocomplete
																{...fieldProps}
																multiple
																options={field.options || []}
																getOptionLabel={(option) => option || ''}
																isOptionEqualToValue={(option, val) => option === val}
																value={fieldProps.value || []}
																onChange={(e, newValue) => fieldProps.onChange(newValue)}
																renderOption={(props, option, { selected }) => (
																	<ListItem
																		{...props}
																		key={option} // Use option as key, assuming it's unique
																		style={getOptionStyles(option, selected)}
																	>
																		{option || 'Unknown'}
																	</ListItem>
																)}
																renderInput={(params) => (
																	<TextField
																		{...params}
																		label={`${field.name}`}
																		variant="outlined"

																		fullWidth
																	/>
																)}
																renderTags={(value, getTagProps) =>
																	value.map((option, index) => (
																		<Chip
																			{...getTagProps({ index })}
																			key={option || `tag-${index}`} // Use option or fallback to index-based key
																			label={option || 'Unknown'}
																			sx={{
																				backgroundColor: (typeof option === 'string' ? option.toLowerCase() : 'gray'),
																				'&.MuiChip-root': {
																					color: getContrastColor(typeof option === 'string' ? option.toLowerCase() : 'gray'),
																				},
																				'& .MuiChip-deleteIcon': {
																					color: getContrastColor(typeof option === 'string' ? option.toLowerCase() : 'gray'),
																					'&:hover': {
																						color: getContrastColor(typeof option === 'string' ? option.toLowerCase() : 'gray'),
																					},
																				},
																			}}
																		/>
																	))
																}
															/>
														) : field.type === 'select' ? (
															<Autocomplete
																{...fieldProps}
																multiple={field.multiple || false}
																options={field.options || []}
																getOptionLabel={(option) => option || ''}
																isOptionEqualToValue={(option, value) => option === value}
																value={
																	field.multiple
																		? fieldProps.value || []
																		: fieldProps.value || null
																}
																onChange={(event, newValue) => fieldProps.onChange(newValue)}
																renderOption={(props, option) => (
																	<li {...props} key={option || `option-${index}`}> {/* Add key here if needed */}
																		{option || 'Unknown'}
																	</li>
																)}
																renderInput={(params) => (
																	<TextField
																		{...params}
																		label={`${field.name} ${field.unit ? `(${field.unit})` : ''}`}
																		variant="outlined"
																		required
																		fullWidth
																	/>
																)}
															/>
														) : (
															<TextField
																{...fieldProps}
																type={field.type}
																label={`${field.name} ${field.unit ? `(${field.unit})` : ''}`}
																variant="outlined"
																fullWidth
																required
																InputProps={{
																	sx: { backgroundColor: 'white' },
																}}
															/>
														)}
													</div>
												)}
											/>
											<button
												type="button"
												onClick={() => handleRemoveField(field.id)}
												className="ml-2 p-2 text-red-500 hover:text-red-700 cursor-pointer"
											>
												✖
											</button>
										</div>
									))}
								</div>
							);
						}}
					/>
				</div>
			</div>

			{/* Active Switch */}
			<Controller
				name="active"
				control={control}
				// defaultValue={0}
				render={({ field }) => {
					console.log("Active field value:", field.value);
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
								⚠️ Before activating, make sure required fields (Name, Description, Category, Sub-category, one extraFields with its value, Image, All Prices,etc.) are filled.
							</Typography>
						</div>
					)
				}}
			/>

		</div>
	);
}

export default BasicInfoTab;