'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, SyntheticEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import FuseLoading from '@fuse/core/FuseLoading';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { styled } from '@mui/material/styles';
import Alert from '@mui/material/Alert';
import { motion } from 'framer-motion';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FuseTabs from 'src/components/tabs/FuseTabs';
import FuseTab from 'src/components/tabs/FuseTab';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import ProfileHeader from './ProfileHeader';
import BasicInfoTab from './tabs/BasicInfoTab';
import ProfileImageTab from './tabs/ProfileImageTab';
import AddressTab from './tabs/AddressTab';
import BusinessInfoTab from './tabs/BusinessInfoTab';
import {
	useGetProfileQuery,
	useCreateProfileMutation,
	useUpdateProfileMutation,
	useUpdatePasswordMutation
} from '@/app/(control-panel)/(user)/accounts/apis/ProfileApi';
import { useSnackbar } from 'notistack';
import ChangePasswordTab from './tabs/ChangePasswordTab';
import { SuccessDialog } from '@/components/DialogComponents';

// ---------------- Validation schema ----------------
const baseSchema = z.object({
	name: z.string().max(100).optional(),
	first_name: z.string().max(50).optional(),
	last_name: z.string().max(50).optional(),
	phone: z.string().max(20).optional(),
	email: z.string().email().optional(),
	dob: z.string().optional().or(z.literal('')),
	gender: z.enum(['male', 'female', 'other']).optional().or(z.literal('')),
	status: z.enum(['active', 'suspended', 'pending', 'inactive']).optional(),
	address: z.string().max(100).optional(),
	city: z.string().max(50).optional(),
	state: z.string().max(50).optional(),
	country: z.string().max(50).optional(),
	postal_code: z.string().max(20).optional(),
	lat: z.coerce.number().min(-90).max(90).optional(),
	lng: z.coerce.number().min(-180).max(180).optional(),
	company_name: z.string().max(100).optional(),
	tax_id: z.string().max(50).optional(),
	bank_account: z.string().max(50).optional(),
	website: z.string().max(255).optional(),
	image: z.string().optional(),
	current_password: z.string().min(1, 'Current password required').optional(),
	new_password: z.string().min(6, 'New password must be at least 6 characters').optional(),
	confirm_password: z.string().min(6, 'Confirm password required').optional()
});

const schema = (tabValue: string) =>
	baseSchema.refine(
		(data) => {
			if (tabValue === 'change-password') {
				return (
					data.current_password &&
					data.new_password &&
					data.confirm_password &&
					data.new_password === data.confirm_password
				);
			}

			return true;
		},
		{
			message: 'Passwords do not match or are invalid',
			path: ['confirm_password']
		}
	);

// ---------------- Styled Root ----------------
const Root = styled(FusePageCarded)(({ theme }) => ({
	'& .FusePageCarded-header': {
		minHeight: 72,
		height: 72,
		alignItems: 'center',
		[theme.breakpoints.up('sm')]: { minHeight: 136, height: 136 }
	},
	'& .FusePageCarded-content': { display: 'flex', flexDirection: 'column' }
}));

function ProfilePage() {
	const { data: session, status } = useSession();
	const userId = session?.user?.id;
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
	const pathname = usePathname();
	const router = useRouter();
	const [tabValue, setTabValue] = useState('change-password');
	const [formError, setFormError] = useState<string | null>(null);
	const { enqueueSnackbar } = useSnackbar();
	const [initialized, setInitialized] = useState(false);

	// ---------------- React Hook Form ----------------
	const methods = useForm({
		mode: 'onChange',
		resolver: zodResolver(schema(tabValue)),
		defaultValues: {
			name: session?.user?.name || '',
			email: session?.user?.email || '',
			first_name: '',
			last_name: '',
			phone: '',
			dob: undefined,
			gender: undefined,
			status: 'active',
			address: '',
			city: '',
			state: '',
			country: '',
			postal_code: '',
			lat: 0,
			lng: 0,
			company_name: '',
			tax_id: '',
			bank_account: '',
			website: '',
			image: '',
			current_password: '',
			new_password: '',
			confirm_password: ''
		}
	});

	const { reset, handleSubmit, trigger } = methods;

	// ---------------- RTK Query ----------------
	const { data: profilesData, isLoading } = useGetProfileQuery(userId);
	const [createProfile] = useCreateProfileMutation();
	const [updateProfile] = useUpdateProfileMutation();
	const [updatePassword] = useUpdatePasswordMutation();
	const profile = profilesData?.data;

	const [successDialogOpen, setSuccessDialogOpen] = useState(false);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	// ---------------- Sync profile data ----------------
	useEffect(() => {
		if (!session?.user || !profilesData?.data || initialized) return;

		const existingProfile = profilesData.data;
		const imageUrl = existingProfile.image
			? existingProfile.image.startsWith('http')
				? existingProfile.image
				: `${process.env.NEXT_PUBLIC_API_URL}/${existingProfile.image}`
			: '';

		reset({
			name: session.user.name || '',
			email: session.user.email || '',
			first_name: existingProfile.first_name || '',
			last_name: existingProfile.last_name || '',
			phone: existingProfile.phone || '',
			dob: existingProfile.dob || '',
			gender: existingProfile.gender ?? '',
			status: existingProfile.status ?? 'active',
			address: existingProfile.address || '',
			city: existingProfile.city || '',
			state: existingProfile.state || '',
			country: existingProfile.country || '',
			postal_code: existingProfile.postal_code || '',
			lat: existingProfile.latitude ?? 0,
			lng: existingProfile.longitude ?? 0,
			company_name: existingProfile.company_name || '',
			tax_id: existingProfile.tax_id || '',
			bank_account: existingProfile.bank_account || '',
			website: existingProfile.website || '',
			image: imageUrl,
			current_password: '',
			new_password: '',
			confirm_password: ''
		});

		setInitialized(true);
	}, [session?.user, profilesData, reset, initialized]);

	// ---------------- Revalidate schema on tab change ----------------
	useEffect(() => {
		trigger();
	}, [tabValue, trigger]);

	// ---------------- Set active tab based on URL hash ----------------
	useEffect(() => {
		const hash = window.location.hash.replace('#', '');
		const tabRoutes: Record<string, string> = {
			'change-password': 'change-password',
			address: 'address',
			'profile-image': 'profile-image',
			'business-info': 'business-info',
			'': 'basic-info'
		};

		const newTabValue = tabRoutes[hash] || 'change-password';
		setTabValue(newTabValue);
	}, []);

	// ---------------- Update URL hash on tab change ----------------
	const handleTabChange = (e: SyntheticEvent, val: string) => {
		setTabValue(val);
		const hashMap: Record<string, string> = {
			'basic-info': '',
			'profile-image': 'profile-image',
			address: 'address',
			'business-info': 'business-info',
			'change-password': 'change-password'
		};
		const newHash = hashMap[val] ? `#${hashMap[val]}` : '';
		router.replace(`/accounts/profile${newHash}`, { scroll: false });
	};

	// ---------------- Profile submit handler ----------------
	const onProfileSubmit = async (data: z.infer<ReturnType<typeof schema>>, tab: string) => {
		setFormError(null);

		const tabFields: Record<string, string[]> = {
			'basic-info': ['name', 'first_name', 'last_name', 'phone', 'email', 'dob', 'gender', 'status'],
			'profile-image': ['image'],
			address: ['address', 'city', 'state', 'country', 'postal_code', 'lat', 'lng'],
			'business-info': ['company_name', 'tax_id', 'bank_account', 'website']
		};

		const filteredData = Object.fromEntries(Object.entries(data).filter(([key]) => tabFields[tab]?.includes(key)));

		try {
			if (profile?.id) {
				await updateProfile({ id: profile.id, ...filteredData }).unwrap();
			} else {
				await createProfile({ user_id: userId!, ...filteredData }).unwrap();
			}

			enqueueSnackbar(`${tab.replace('-', ' ')} updated successfully`, { variant: 'success' });
			reset({ ...data, ...filteredData });
		} catch (err: any) {
			// Laravel backend se message catch karna
			const errorMsg =
				err?.data?.message || err?.error || err?.message || 'An unexpected error occurred. Please try again.';

			enqueueSnackbar(errorMsg, { variant: 'error' });
			setFormError(errorMsg);
		}
	};

	// ---------------- Password submit handler ----------------
	const onPasswordSubmit = async (data: {
		current_password: string;
		new_password: string;
		confirm_password: string;
	}) => {
		setFormError(null);
		try {
			await updatePassword({
				current_password: data.current_password,
				new_password: data.new_password,
				new_password_confirmation: data.confirm_password
			}).unwrap();
			enqueueSnackbar('Password updated successfully', { variant: 'success' });
			setSuccessMessage('Password updated successfully');
			setSuccessDialogOpen(true);
			reset({
				...methods.getValues(),
				current_password: '',
				new_password: '',
				confirm_password: ''
			});
		} catch (err: any) {
			const errorMsg = err?.data?.errors?.new_password || err?.data?.message || 'Failed to change password';
			enqueueSnackbar(errorMsg, { variant: 'error' });
			setFormError(errorMsg);
		}
	};

	// ---------------- Dynamic submit handler ----------------
	const handleFormSubmit = (data: z.infer<ReturnType<typeof schema>>) => {
		if (tabValue === 'change-password') {
			return onPasswordSubmit(data);
		}

		return onProfileSubmit(data, tabValue);
	};

	const handleCloseDialog = () => {
		setSuccessDialogOpen(false);
	};

	if (status === 'loading' || isLoading) return <FuseLoading />;

	return (
		<>
			<FormProvider {...methods}>
				<Root
					header={
						<ProfileHeader
							onSubmit={handleSubmit(handleFormSubmit)}
							tabValue={tabValue}
						/>
					}
					content={
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
							className="p-4 sm:p-6 max-w-5xl space-y-6"
						>
							{formError && <Alert severity="error">{formError}</Alert>}

							<FuseTabs
								value={tabValue}
								onChange={handleTabChange}
							>
								<FuseTab
									value="change-password"
									label="Change Password"
								/>
								{/* Uncomment if you want other tabs */}
								{/* <FuseTab value="basic-info" label="Basic Info" />
                            <FuseTab value="profile-image" label="Profile Image" />
                            <FuseTab value="address" label="Address" />
                            <FuseTab value="business-info" label="Business Info" /> */}
							</FuseTabs>

							<div>
								<div className={tabValue !== 'basic-info' ? 'hidden' : ''}>
									<BasicInfoTab />
								</div>
								<div className={tabValue !== 'profile-image' ? 'hidden' : ''}>
									<ProfileImageTab />
								</div>
								<div className={tabValue !== 'address' ? 'hidden' : ''}>
									<AddressTab />
								</div>
								<div className={tabValue !== 'business-info' ? 'hidden' : ''}>
									<BusinessInfoTab />
								</div>
								<div className={tabValue !== 'change-password' ? 'hidden' : ''}>
									<ChangePasswordTab />
								</div>
							</div>
						</motion.div>
					}
					scroll={isMobile ? 'normal' : 'content'}
				/>
			</FormProvider>
			<SuccessDialog
				open={successDialogOpen}
				onClose={handleCloseDialog}
				message={successMessage}
			/>
		</>
	);
}

export default ProfilePage;
