"use client";

import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { motion } from 'motion/react';
import { useFormContext } from 'react-hook-form';
import { useParams } from 'next/navigation';
import _ from 'lodash';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import PageBreadcrumb from 'src/components/PageBreadcrumb';
import useNavigate from '@fuse/hooks/useNavigate';
import {
	EcommerceCategory,
	useCreateECommerceCategoryMutation,
	useDeleteECommerceCategoryMutation,
	useUpdateECommerceCategoryMutation,
} from '../../../apis/CategoriesLaravelApi';
import { ConfirmDialog, SuccessDialog } from '@/components/DialogComponents';
import { enqueueSnackbar } from 'notistack';
import { useState } from 'react';

function CategoryHeader() {
	const routeParams = useParams<{ categoryId: string }>();
	const { categoryId } = routeParams;
	const [createCategory, { isLoading: isCreating }] = useCreateECommerceCategoryMutation();
	const [saveCategory, { isLoading: isSaving }] = useUpdateECommerceCategoryMutation();
	const [removeCategory, { isLoading: isDeleting }] = useDeleteECommerceCategoryMutation();

	// ✅ dialog states
	const [successDialogOpen, setSuccessDialogOpen] = useState(false);
	const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [createdCategoryId, setCreatedCategoryId] = useState<string | null>(null);

	const methods = useFormContext();
	const { formState, watch, getValues } = methods;
	const { isValid, dirtyFields } = formState;

	const navigate = useNavigate();

	const { name, image } = watch() as EcommerceCategory;
	console.log('dirtyFields:', dirtyFields, 'isValid:', isValid);

	function handleSaveCategory() {
		console.log('Saving category');
		saveCategory(getValues() as EcommerceCategory)
			.unwrap()
			.then((data) => {
				setSuccessMessage('Your category has been updated successfully.');
				setSuccessDialogOpen(true);
				enqueueSnackbar('Category updated successfully', {
					variant: 'success',
				});
			})
			.catch((error) => {
				console.error('Error saving category:', error);
				enqueueSnackbar(
					`Failed to update category ${error.data?.error ?? 'An error occurred'}`,
					{ variant: 'error' }
				);
			});
	}

	function handleCreateCategory() {
		console.log('Creating categories');
		createCategory(getValues() as EcommerceCategory)
			.unwrap()
			.then((data) => {
				setSuccessMessage('Your category has been created successfully.');
				setSuccessDialogOpen(true);
				setCreatedCategoryId(data.data.id);
				enqueueSnackbar('Category created successfully', {
					variant: 'success',
				});
			})
			.catch((error) => {
				console.error('Error creating category:', error);
				enqueueSnackbar(
					`Failed to create category ${error.data?.error ?? 'An error occurred'}`,
					{ variant: 'error' }
				);
			});
	}

	/** ✅ Remove button handler - opens confirm dialog */
	function handleRemoveCategory() {
		setConfirmDialogOpen(true);
	}

	/** ✅ Remove confirm handler */
	function handleRemoveConfirmed() {
		removeCategory(categoryId)
			.unwrap()
			.then(() => {
				enqueueSnackbar('Category deleted successfully', {
					variant: 'success',
				});
				navigate('/apps/e-commerce/categories');
			})
			.catch((error) => {
				console.error('Error deleting category:', error.data?.error);
				enqueueSnackbar(
					`Failed to delete category ${error.data?.error ?? 'An error occurred'}`,
					{ variant: 'error' }
				);
			})
			.finally(() => setConfirmDialogOpen(false));
	}

	/** ✅ Success dialog close (redirect after action) */
	function handleCloseDialog() {
		setSuccessDialogOpen(false);
		if (createdCategoryId) {
			navigate(`/apps/e-commerce/categories/${createdCategoryId}`);
		}
	}

	console.log(categoryId, image, 'categoryId last');

	return (
		<div className="flex flex-col sm:flex-row flex-1 w-full items-center justify-between space-y-2 sm:space-y-0 py-6 sm:py-8">
			<div className="flex flex-col items-start space-y-2 sm:space-y-0 w-full sm:max-w-full min-w-0">
				<motion.div
					initial={{ x: 20, opacity: 0 }}
					animate={{ x: 0, opacity: 1, transition: { delay: 0.3 } }}
				>
					<PageBreadcrumb className="mb-2" />
				</motion.div>
				<div className="flex items-center max-w-full space-x-3">
					<motion.div
						className="hidden sm:flex"
						initial={{ scale: 0 }}
						animate={{ scale: 1, transition: { delay: 0.3 } }}
					>
						{image ? (
							<img
								className="w-8 sm:w-12 rounded-sm"
								src={image}
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
							{name || 'New Category'}
						</Typography>
						<Typography
							variant="caption"
							className="font-medium"
						>
							Category Detail
						</Typography>
					</motion.div>
				</div>
			</div>
			<motion.div
				className="flex flex-1 w-full"
				initial={{ opacity: 0, x: 20 }}
				animate={{ opacity: 1, x: 0, transition: { delay: 0.3 } }}
			>
				{categoryId !== 'new' ? (
					<>
						<Button
							className="whitespace-nowrap mx-1"
							variant="contained"
							color="secondary"
							onClick={handleRemoveCategory}
							disabled={isDeleting}
							startIcon={<FuseSvgIcon className="hidden sm:flex">heroicons-outline:trash</FuseSvgIcon>}
						>
							{isDeleting ? 'Removing...' : 'Remove'}
						</Button>
						<Button
							className="whitespace-nowrap mx-1"
							variant="contained"
							color="secondary"
							disabled={_.isEmpty(dirtyFields) || !isValid || isSaving}
							onClick={handleSaveCategory}
						>
							{isSaving ? 'Saving...' : 'Save'}
						</Button>
					</>
				) : (
					<Button
						className="whitespace-nowrap mx-1"
						variant="contained"
						color="secondary"
						disabled={_.isEmpty(dirtyFields) || !isValid || isCreating}
						onClick={handleCreateCategory}
					>
						{isCreating ? 'Adding...' : 'Add'}
					</Button>
				)}
			</motion.div>

			{/* ✅ Dialogs */}
			<SuccessDialog
				open={successDialogOpen}
				onClose={handleCloseDialog}
				message={successMessage}
			/>

			<ConfirmDialog
				open={confirmDialogOpen}
				onClose={() => setConfirmDialogOpen(false)}
				onConfirm={handleRemoveConfirmed}
				isDeleting={isDeleting}
			/>
		</div>
	);
}

export default CategoryHeader;