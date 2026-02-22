'use client';

import { useEffect, useRef, useState } from 'react';
import { lighten, styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { Controller, useFormContext } from 'react-hook-form';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';

const Root = styled('div')(({ theme }) => ({
	'& .imageUploadBox': {
		transition: theme.transitions.create('box-shadow', {
			duration: theme.transitions.duration.short,
			easing: theme.transitions.easing.easeInOut
		})
	},
	'& .imagePreviewBox': {
		transition: theme.transitions.create('box-shadow', {
			duration: theme.transitions.duration.short,
			easing: theme.transitions.easing.easeInOut
		}),
		boxShadow: theme.shadows[1]
	}
}));

function ImageUpload({ name, index }) {
	const { control, watch, setValue } = useFormContext();
	const fieldName = name || `variants[${index}].variant_image`; // Dynamic field name

	const variantImage = watch(fieldName) as string | null;

	// Store original values to detect changes
	const originalVariantRef = useRef<string | null>(null);

	// State for delete confirmation modal
	const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

	useEffect(() => {
		console.log(`ImageUpload: fieldName=${fieldName}, variantImage=${variantImage}`);
		originalVariantRef.current = variantImage;
	}, [variantImage, fieldName]);

	const handleFileUpload = (file: File) => {
		console.log('handleFileUpload: Uploading file', file.name);
		const reader = new FileReader();
		reader.onload = () => {
			const base64 = `data:${file.type};base64,${btoa(reader.result as string)}`;
			console.log('handleFileUpload: Setting base64 image', base64.substring(0, 50) + '...');
			setValue(fieldName, base64, { shouldDirty: true });
		};
		reader.readAsBinaryString(file);
	};

	const handleDeleteClick = () => {
		console.log('handleDeleteClick: Opening delete confirmation dialog');
		setOpenDeleteDialog(true);
	};

	const handleDeleteConfirm = () => {
		console.log('handleDeleteConfirm: Deleting image for', fieldName);
		setValue(fieldName, null, { shouldDirty: true });
		setOpenDeleteDialog(false);
	};

	const handleDeleteCancel = () => {
		console.log('handleDeleteCancel: Canceling delete');
		setOpenDeleteDialog(false);
	};

	const renderImageField = (value: string | null, onChange: (val: string) => void) => (
		<div className="flex flex-col items-start mx-3 mb-6">
			<span className="font-semibold text-sm mb-2">Variant Image</span>
			<div className="flex items-center space-x-4">
				<Box
					sx={(theme) => ({
						backgroundColor: lighten(theme.palette.background.default, 0.02),
						...theme.applyStyles('light', {
							backgroundColor: lighten(theme.palette.background.default, 0.2)
						})
					})}
					component="label"
					htmlFor={`file-input-${fieldName}`}
					className="imageUploadBox flex items-center justify-center relative w-32 h-32 rounded-lg overflow-hidden cursor-pointer shadow-sm hover:shadow-lg"
				>
					<input
						accept="image/*"
						className="hidden"
						id={`file-input-${fieldName}`}
						type="file"
						onChange={(e) => {
							const file = e.target.files?.[0];

							if (file) {
								handleFileUpload(file);
							}
						}}
					/>
					<FuseSvgIcon
						size={32}
						color="action"
					>
						heroicons-outline:arrow-up-on-square
					</FuseSvgIcon>
				</Box>

				{value && (
					<Box
						sx={(theme) => ({
							backgroundColor: lighten(theme.palette.background.default, 0.02),
							...theme.applyStyles('light', {
								backgroundColor: lighten(theme.palette.background.default, 0.2)
							})
						})}
						className="imagePreviewBox flex items-center justify-center relative w-32 h-32 rounded-lg overflow-hidden"
					>
						<img
							className="max-w-none w-auto h-full"
							src={value}
							alt="Variant Image"
						/>
						<Box
							sx={{
								position: 'absolute',
								bottom: 4,
								right: 4,
								cursor: 'pointer',
								padding: 0.5,
								borderRadius: 1.5,
								backgroundColor: 'rgba(0,0,0,0.6)',
								color: '#fff',
								'&:hover': {
									backgroundColor: 'rgba(0,0,0,0.8)'
								}
							}}
							onClick={handleDeleteClick}
						>
							<FuseSvgIcon size={20}>heroicons-outline:trash</FuseSvgIcon>
						</Box>
					</Box>
				)}
			</div>
		</div>
	);

	return (
		<Root>
			<div className="flex justify-start flex-wrap -mx-3">
				<Controller
					name={fieldName}
					control={control}
					render={({ field: { onChange, value } }) => renderImageField(value, onChange)}
				/>
			</div>
			<Dialog
				open={openDeleteDialog}
				onClose={handleDeleteCancel}
				aria-labelledby="alert-dialog-title"
				aria-describedby="alert-dialog-description"
			>
				<DialogTitle id="alert-dialog-title">Confirm Delete</DialogTitle>
				<DialogContent>
					<DialogContentText id="alert-dialog-description">
						Are you sure you want to delete this image?
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={handleDeleteCancel}
						color="primary"
					>
						Cancel
					</Button>
					<Button
						onClick={handleDeleteConfirm}
						color="error"
						autoFocus
					>
						Delete
					</Button>
				</DialogActions>
			</Dialog>
		</Root>
	);
}

export default ImageUpload;
