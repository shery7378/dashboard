'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, SyntheticEvent } from 'react';
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
	useGetProfilesQuery,
	useCreateProfileMutation,
	useUpdateProfileMutation
} from '@/app/(control-panel)/(user)/account/apis/ProfileApi';
import { useSnackbar } from 'notistack';

// ---------------- Validation schema ----------------
export const schema = z.object({
	name: z.string().max(100).optional(),
	first_name: z.string().max(50).optional(),
	last_name: z.string().max(50).optional(),
	phone: z.string().max(20).optional(),
	email: z.string().email(),
	dob: z.string().optional(),
	gender: z.enum(['male', 'female', 'other']).optional().or(z.literal('')),
	status: z.enum(['active', 'suspended', 'pending', 'inactive']).optional(),
	address: z.string().max(100).optional(),
	city: z.string().max(50).optional(),
	state: z.string().max(50).optional(),
	country: z.string().max(50).optional(),
	postal_code: z.string().max(20).optional(),
	lat: z.coerce.number().min(-90).max(90).optional(),
	lng: z.coerce.number().min(-180).max(180).optional(),
	company_name: z.string().min(1).max(100),
	tax_id: z.string().max(50).optional(),
	bank_account: z.string().max(50).optional(),
	website: z.string().max(255).optional(),
	image: z.string().optional()
});

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
	const [tabValue, setTabValue] = useState('basic-info');
	const [formError, setFormError] = useState<string | null>(null);
	const { enqueueSnackbar } = useSnackbar(); // ✅ added
	const [initialized, setInitialized] = useState(false);

	// RTK Query hooks
	const { data: profilesData, isLoading } = useGetProfilesQuery(undefined);
	const [createProfile, { isLoading: creating }] = useCreateProfileMutation();
	const [updateProfile, { isLoading: updating }] = useUpdateProfileMutation();

	const profile = profilesData?.data?.[0]; // Single profile for logged-in user

	// ---------------- Form setup ----------------
	const methods = useForm({
		mode: 'onChange',
		defaultValues: {
			name: session?.user?.name || '',
			email: session?.user?.email || '',
			first_name: '',
			last_name: '',
			phone: '',
			dob: '',
			gender: undefined,
			status: undefined,
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
			image: ''
		},
		resolver: zodResolver(schema)
	});

	const {
		reset,
		handleSubmit,
		formState: { isSubmitting }
	} = methods;

	// ---------------- Sync form with session + profile ----------------
	useEffect(() => {
		if (!session?.user || initialized) return;

		reset({
			name: session.user.name || '',
			email: session.user.email || '',

			first_name: profile?.first_name || '',
			last_name: profile?.last_name || '',
			phone: profile?.phone || '',
			dob: profile?.dob || '',
			gender: profile?.gender ?? '',
			status: profile?.status ?? 'active',
			address: profile?.address || '',
			city: profile?.city || '',
			state: profile?.state || '',
			country: profile?.country || '',
			postal_code: profile?.postal_code || '',
			lat: profile?.latitude ?? 0,
			lng: profile?.longitude ?? 0,
			company_name: profile?.company_name || '',
			tax_id: profile?.tax_id || '',
			bank_account: profile?.bank_account || '',
			website: profile?.website || '',
			image: profile?.image || ''
		});
		setInitialized(true); // ✅ prevent future resets
	}, [session?.user, profile, reset, initialized]);

	// ---------------- Submit handler ----------------
	const onSubmit = async (data: z.infer<typeof schema>) => {
		setFormError(null);

		try {
			if (profile?.id) {
				await updateProfile({ id: profile.id, ...data }).unwrap();
			} else {
				await createProfile({ user_id: userId!, ...data }).unwrap();
			}

			enqueueSnackbar('Profile updated successfully', { variant: 'success' }); // ✅ added
		} catch (err: any) {
			const errorMsg = err?.data?.error || err?.error || 'Failed to save profile';
			enqueueSnackbar(errorMsg, { variant: 'error' });
			setFormError(errorMsg);
		}
	};

	if (status === 'loading' || isLoading) return <FuseLoading />;

	return (
		<FormProvider {...methods}>
			<Root
				header={<ProfileHeader onSubmit={handleSubmit(onSubmit)} />}
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
							onChange={(e: SyntheticEvent, val: string) => setTabValue(val)}
						>
							<FuseTab
								value="basic-info"
								label="Basic Info"
							/>
							<FuseTab
								value="profile-image"
								label="Profile Image"
							/>
							<FuseTab
								value="address"
								label="Address"
							/>
							<FuseTab
								value="business-info"
								label="Business Info"
							/>
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
						</div>

						{/* INLINE BUTTON REMOVED */}
					</motion.div>
				}
				scroll={isMobile ? 'normal' : 'content'}
			/>
		</FormProvider>
	);
}

export default ProfilePage;
