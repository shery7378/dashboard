import { orange } from '@mui/material/colors';
import { lighten, styled } from '@mui/material/styles';
import clsx from 'clsx';
import FuseUtils from '@fuse/utils';
import { Controller, useFormContext } from 'react-hook-form';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Box from '@mui/material/Box';
import { EcommerceProduct } from '../../../../apis/ProductsLaravelApi';
import {
	Typography,
	IconButton,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	Button,
} from '@mui/material';
import { useState } from 'react';

const Root = styled('div')(({ theme }) => ({
	'& .productImageFeaturedStar': {
		position: 'absolute',
		top: 0,
		right: 0,
		color: orange[400],
		opacity: 0,
	},
	'& .productImageUpload': {
		transition: theme.transitions.create('box-shadow'),
	},
	'& .productImageItem': {
		position: 'relative',
		transition: theme.transitions.create('box-shadow'),
		'&:hover .productImageFeaturedStar': {
			opacity: 0.8,
		},
		'&.featured': {
			boxShadow: theme.shadows[3],
			'& .productImageFeaturedStar': {
				opacity: 1,
			},
		},
	},
	'& .deleteIcon': {
		position: 'absolute',
		bottom: 4,
		right: 4,
		backgroundColor: 'rgba(0,0,0,0.6)',
		color: '#fff',
		'&:hover': {
			backgroundColor: 'rgba(0,0,0,0.8)',
		},
	},
}));

/**
 * The product gallery_images tab.
 */
const ProductImagesTab = () => {
	const methods = useFormContext();
	const { control, watch, formState } = methods;
	const { errors } = formState;
	const gallery_images = watch('gallery_images') as EcommerceProduct['gallery_images'];

	const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

	const handleDeleteConfirm = () => {
		if (deleteIndex !== null) {
			const updated = gallery_images.filter((_, i) => i !== deleteIndex);
			methods.setValue('gallery_images', updated, { shouldDirty: true, shouldValidate: true, shouldTouch: true, });
			setDeleteIndex(null);
		}
	};

	return (
		<Root>
			<div className="mb-4 px-3">
				<Typography variant="body2" color="textSecondary">
					Click an image to mark it as <strong>Featured</strong>. Click again to <strong>remove</strong> the featured selection.
				</Typography>
			</div>

			{errors.gallery_images && (
				<Typography color="error" className="ml-3 mb-2 text-sm">
					{errors.gallery_images.message}
				</Typography>
			)}


			<div className="flex justify-center sm:justify-start flex-wrap -mx-3">
				<Controller
					name="gallery_images"
					control={control}
					error={!!errors.name}
					helperText={errors?.name?.message as string}
					render={({ field: { onChange, value } }) => (
						<Box
							component="label"
							htmlFor="button-file"
							className="productImageUpload flex items-center justify-center relative w-32 h-32 rounded-lg mx-3 mb-6 overflow-hidden cursor-pointer shadow-sm hover:shadow-lg"
						>
							<input
								accept="image/*"
								className="hidden"
								id="button-file"
								type="file"
								multiple // ✅ allow multiple files
								onChange={async (e) => {
									const files = Array.from(e.target.files || []);
									if (!files.length) return;

									const imagesPromises = files.map(file => {
										return new Promise(resolve => {
											const reader = new FileReader();
											reader.onload = () => {
												const base64Image = {
													url: `data:${file.type};base64,${btoa(reader.result as string)}`,
													type: 'image',
													is_featured: false,
												};
												resolve(base64Image);
											};
											reader.readAsBinaryString(file);
										});
									});

									const images = await Promise.all(imagesPromises);
									onChange([...images, ...value]);
								}}
							/>
							<FuseSvgIcon size={32} color="action">
								heroicons-outline:arrow-up-on-square
							</FuseSvgIcon>
						</Box>
					)}
				/>

				{gallery_images.map((media, index) => (
					<Box
						key={media.id ?? media.url ?? index}
						onClick={() => {
							const isFeatured = media.is_featured;
							const updated = gallery_images.map((img, i) => ({
								...img,
								is_featured: i === index ? !isFeatured : false,
							}));
							methods.setValue('gallery_images', updated, { shouldDirty: true, shouldTouch: true });
							methods.setValue('featured_image_id', null, { shouldDirty: true });
						}}
						role="button"
						tabIndex={0}
						className={clsx(
							'productImageItem flex items-center justify-center relative w-32 h-32 rounded-lg mx-3 mb-6 overflow-hidden cursor-pointer outline-none shadow-sm hover:shadow-lg',
							media.is_featured && 'featured'
						)}
					>
						<FuseSvgIcon className="productImageFeaturedStar">
							heroicons-solid:star
						</FuseSvgIcon>
						<img className="max-w-none w-auto h-full" src={media.url} alt="product" />

						<IconButton
							className="deleteIcon"
							size="small"
							onClick={(e) => {
								e.stopPropagation();
								setDeleteIndex(index);
							}}
						>
							<FuseSvgIcon size={20}>heroicons-outline:trash</FuseSvgIcon>
						</IconButton>
					</Box>
				))}
			</div>

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteIndex !== null} onClose={() => setDeleteIndex(null)}>
				<DialogTitle>Delete Image</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Are you sure you want to delete this image from the gallery?
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteIndex(null)} color="primary">
						Cancel
					</Button>
					<Button onClick={handleDeleteConfirm} color="error" autoFocus>
						Delete
					</Button>
				</DialogActions>
			</Dialog>
		</Root>
	);
};

export default ProductImagesTab;
