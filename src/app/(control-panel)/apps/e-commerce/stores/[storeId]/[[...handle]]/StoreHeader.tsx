'use client';

import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import PageBreadcrumb from 'src/components/PageBreadcrumb';
import useNavigate from '@fuse/hooks/useNavigate';
import {
	EcommerceStore,
	useCreateECommerceStoreMutation,
	useDeleteECommerceStoreMutation,
	useUpdateECommerceStoreMutation
} from '../../../apis/StoresLaravelApi';
import { ConfirmDialog, SuccessDialog } from '@/components/DialogComponents';
import { useFormContext, FieldValues } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';

interface StoreHeaderProps {
	activeTab: string;
	getValues: () => EcommerceStore;
	originalValues: Partial<EcommerceStore>;
}

// Field map per tab
const tabFields: Record<string, (keyof EcommerceStore)[]> = {
	'basic-info': ['name', 'description', 'slug'],
	'store-images': ['logo', 'banner_image'],
	'store-address': ['address', 'zip_code', 'city', 'country', 'latitude', 'longitude'],
	'store-settings': ['contact_email', 'contact_phone', 'active', 'offers_delivery', 'offers_pickup'],
	'seo-settings': ['meta_title', 'meta_description', 'meta_keywords']
};

export default function StoreHeader({ activeTab, getValues, originalValues }: StoreHeaderProps) {
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const routeParams = useParams<{ storeId: string }>();
	const { storeId } = routeParams;

	const [createStore, { isLoading: isCreating }] = useCreateECommerceStoreMutation();
	const [updateStore, { isLoading: isUpdating }] = useUpdateECommerceStoreMutation();
	const [deleteStore, { isLoading: isDeleting }] = useDeleteECommerceStoreMutation();
	const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
	const [successDialogOpen, setSuccessDialogOpen] = useState(false);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const { data: session } = useSession();
	const userRoles = session?.user?.role || []; // ["vendor"] etc
	const isAdmin = userRoles.includes("admin");

	// console.log(userRoles, 'user roles from store header', isAdmin);
	const { setError, clearErrors } = useFormContext<FieldValues>();
	const values = getValues();

	// --- Helpers ---
	const stripBaseUrl = (url: string | null) => {
		const base = process.env.NEXT_PUBLIC_API_URL || 'http://api.multikonnect.test:8000';
		return url?.startsWith(base) ? url.replace(base + '/', '') : url;
	};

	const sanitizeImageFields = (data: EcommerceStore) => ({
		...data,
		logo: data.logo?.startsWith('data:image') ? data.logo : stripBaseUrl(data.logo),
		banner_image: data.banner_image?.startsWith('data:image') ? data.banner_image : stripBaseUrl(data.banner_image)
	});

	// --- Validation ---
	const validateTab = (): boolean => {
		clearErrors();
		let valid = true;
		const fieldsToCheck = tabFields[activeTab] || [];
		const currentValues = getValues();

		fieldsToCheck.forEach((field) => {
			const dbValue = originalValues[field];
			const currentValue = currentValues[field];

			// ✅ booleans are always valid
			if (typeof currentValue === 'boolean') return;

			// ✅ image fields: only error if DB had one and user clears it
			if ((field === 'logo' || field === 'banner_image') && dbValue && !currentValue) {
				setError(field, { type: 'manual', message: `${field.replace('_', ' ')} cannot be empty` });
				valid = false;
			}

			// ✅ normal fields: only error if DB had value and user clears it
			if (!(field === 'logo' || field === 'banner_image') && dbValue && !currentValue) {
				setError(field, { type: 'manual', message: `${field.replace('_', ' ')} cannot be empty` });
				valid = false;
			}
		});

		if (!valid) enqueueSnackbar('Please fix errors before saving', { variant: 'error' });
		return valid;
	};

	// --- Payload Builder ---
	const buildPayload = (): Partial<EcommerceStore> => {
		const fieldsToSave = tabFields[activeTab] || [];
		const currentValues = getValues();
		const payload: Partial<EcommerceStore> = {};

		fieldsToSave.forEach((field) => {
			const value = currentValues[field];
			if (field === 'logo' || field === 'banner_image') {
				payload[field] = sanitizeImageFields({ [field]: value } as EcommerceStore)[field];
			} else {
				(payload as any)[field] = value;
			}
		});

		return payload;
	};

	// --- Save Handler ---
	const saveTabData = () => {
		if (!validateTab()) return;
		const payload = buildPayload();

		if (storeId === 'new') {
			createStore(payload)
				.unwrap()
				.then(() => enqueueSnackbar('Tab saved successfully', { variant: 'success' }))
				.catch(() => enqueueSnackbar('Failed to save tab', { variant: 'error' }));
		} else {
			updateStore({ ...payload, id: storeId })
				.unwrap()
				.then(() => {
					enqueueSnackbar('Tab updated successfully', { variant: 'success' });
					setSuccessMessage("Your store has been updated successfully.");
					setSuccessDialogOpen(true);
				})
				.catch(() => enqueueSnackbar('Failed to update tab', { variant: 'error' }));
		}
	};
	// --- Success Dialog Handler ---
	const handleCloseDialog = () => {
		setSuccessDialogOpen(false);
		// navigate(`/apps/e-commerce/stores/${createdStoreId}`);
	};

	// --- Remove Handlers ---
	const handleConfirmRemove = () => setConfirmDialogOpen(true);
	const handleRemoveConfirmed = () => {
		setConfirmDialogOpen(false);
		deleteStore(storeId)
			.unwrap()
			.then(() => {
				enqueueSnackbar('Store deleted successfully', { variant: 'success' });
				navigate('/apps/e-commerce/stores/new');
			})
			.catch((error) =>
				enqueueSnackbar(`Failed to delete store ${error.data?.error || ''}`, { variant: 'error' })
			);
	};

	// --- Render ---
	return (
		<>
			<div className="flex flex-col sm:flex-row flex-1 w-full items-center justify-between space-y-2 sm:space-y-0 py-6 sm:py-8">
				{/* Left Section */}
				<div className="flex flex-col items-start space-y-2 sm:space-y-0 w-full sm:max-w-full min-w-0">
					<motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1, transition: { delay: 0.3 } }}>
						<PageBreadcrumb className="mb-2" />
					</motion.div>
					<div className="flex items-center max-w-full space-x-3">
						<motion.div
							className="hidden sm:flex"
							initial={{ scale: 0 }}
							animate={{ scale: 1, transition: { delay: 0.3 } }}
						>
							<img
								className="w-8 sm:w-12 rounded-sm"
								src={values.logo || '/assets/images/apps/ecommerce/product-image-placeholder.png'}
								alt={values.name || 'New Store'}
							/>
						</motion.div>
						<motion.div
							className="flex flex-col min-w-0"
							initial={{ x: -20 }}
							animate={{ x: 0, transition: { delay: 0.3 } }}
						>
							<Typography className="text-lg sm:text-2xl truncate font-semibold">
								{values.name || 'New Store'}
							</Typography>
							<Typography variant="caption" className="font-medium">
								Store Detail
							</Typography>
						</motion.div>
					</div>
				</div>

				{/* Right Section */}
				<motion.div
					className="flex flex-1 w-full justify-end"
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0, transition: { delay: 0.3 } }}
				>
					{storeId !== 'new' ? (
						<>
							{/* Remove button sirf admin ko dikhao */}
							{isAdmin && (
								<Button
									className="whitespace-nowrap mx-1"
									variant="contained"
									color="secondary"
									onClick={handleConfirmRemove}
									startIcon={
										<FuseSvgIcon className="hidden sm:flex">heroicons-outline:trash</FuseSvgIcon>
									}
									disabled={isDeleting}
								>
									{isDeleting ? 'Removing...' : 'Remove'}
								</Button>
							)}

							<Button
								className="whitespace-nowrap mx-1"
								variant="contained"
								color="secondary"
								disabled={isUpdating}
								onClick={saveTabData}
							>
								{isUpdating ? 'Saving...' : 'Save'}
							</Button>
						</>
					) : (
						<Button
							className="whitespace-nowrap mx-1"
							variant="contained"
							color="secondary"
							disabled={isCreating}
							onClick={saveTabData}
						>
							{isCreating ? 'Adding...' : 'Add'}
						</Button>
					)}
				</motion.div>
			</div>

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
		</>
	);
}