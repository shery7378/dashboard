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
import UserHeader from './UserHeader';
import BasicInfoTab from './tabs/BasicInfoTab';
import LocationTab from './tabs/LocationTab';
import { useSnackbar } from 'notistack';
import { useGetProfileQuery, useCreateProfileMutation, useCreateUserMutation, useUpdateProfileMutation, useDeleteProfileMutation, } from '../apis/ProfileApi';
import { useParams, useRouter } from 'next/navigation';
import { ConfirmDialog, SuccessDialog } from '@/components/DialogComponents';

// ---------------- Validation schema ----------------
export const createProfileSchema = z
    .object({
        user_type: z.enum(['customer', 'seller', 'supplier'], {
            errorMap: () => ({ message: 'Please select a valid role' }),
        }),
        store_name: z.string().max(100).optional(),
        name: z.string().max(100).optional(),
        first_name: z.string().max(50).optional(),
        last_name: z.string().max(50).optional(),
        phone: z.string().max(20).optional(),
        city: z.string().max(255).optional(),
        address: z.string().max(500).optional(),
        state: z.string().max(255).optional(),
        country: z.string().max(255).optional(),
        postal_code: z.string().max(20).optional(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        delivery_radius: z.number().min(0.1).max(1000).optional(),
        email: z.string().email(),
        status: z.enum(['active']).default('active'),
        password: z
            .string()
            .min(6, { message: 'Password is required and must be at least 6 characters' }),
        confirm_password: z.string(),
    })
    .refine((data) => data.password === data.confirm_password, {
        message: 'Passwords do not match',
        path: ['confirm_password'],
    });

export const updateProfileSchema = z
    .object({
        user_type: z.enum(['customer', 'seller', 'supplier']),
        store_name: z.string().max(100).optional(),
        name: z.string().max(100).optional(),
        city: z.string().max(255).optional(),
        address: z.string().max(500).optional(),
        state: z.string().max(255).optional(),
        country: z.string().max(255).optional(),
        postal_code: z.string().max(20).optional(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        delivery_radius: z.number().min(0.1).max(1000).optional(),
        first_name: z.string().max(50).optional(),
        last_name: z.string().max(50).optional(),
        phone: z.string().max(20).optional(),
        email: z.string().email(),
        status: z.enum(['active', 'in_active', 'suspend']).default('active'),
        password: z.string().optional(),
        confirm_password: z.string().optional(),
    })
    .refine(
        (data) =>
            !data.password || data.password === data.confirm_password, // only check match if password entered
        {
            message: 'Passwords do not match',
            path: ['confirm_password'],
        }
    );

// ---------------- Styled Root ----------------
const Root = styled(FusePageCarded)(({ theme }) => ({
    '& .FusePageCarded-header': {
        minHeight: 72,
        height: 72,
        alignItems: 'center',
        [theme.breakpoints.up('sm')]: {
            minHeight: 136,
            height: 136,
        },
    },
    '& .FusePageCarded-content': {
        display: 'flex',
        flexDirection: 'column',
    },
}));

function UserPage() {
    const { status } = useSession();
    const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
    const [tabValue, setTabValue] = useState('basic-info');
    const [formError, setFormError] = useState<string | null>(null);
    const { enqueueSnackbar } = useSnackbar();
    const [initialized, setInitialized] = useState(false);
    const { userId } = useParams<{ userId: string }>();
    const router = useRouter();

    const [successDialogOpen, setSuccessDialogOpen] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // RTK Query
    const { data: profileResponse, isLoading } = useGetProfileQuery(userId);
    const [createProfile, { isLoading: creating }] = useCreateUserMutation();
    const [updateProfile, { isLoading: updating }] = useUpdateProfileMutation();
    const [deleteProfile, { isLoading: isDeleting }] = useDeleteProfileMutation();

    const profile = profileResponse?.data || profileResponse?.data?.[0] || null;
    const isNewProfile = !profile?.id;
    console.log(profile, 'data profile');
    // ---------------- Form setup ----------------
    const methods = useForm({
        mode: 'onChange',
        resolver: zodResolver(isNewProfile ? createProfileSchema : updateProfileSchema),
        defaultValues: {
            user_type: 'customer',
            store_name: '',
            name: '',
            first_name: '',
            last_name: '',
            phone: '',
            email: '',
            city: '',
            address: '',
            state: '',
            country: '',
            postal_code: '',
            latitude: undefined,
            longitude: undefined,
            delivery_radius: 10,
            status: 'active',
            password: '',
            confirm_password: '',
        },
    });

    const { reset, handleSubmit, watch } = methods;

    // ---------------- Sync form with profile ----------------
    useEffect(() => {
        if (!profile || initialized) return;

        const role = profile?.user?.roles?.[0];
        let defaultValues: any = {
            user_type: role,
            email: profile?.user?.email || '',
            status: profile?.status ?? 'active',
            password: '',
            confirm_password: '',
        };

        if (role === 'customer') {
            defaultValues = {
                ...defaultValues,
                first_name: profile?.first_name || '',
                last_name: profile?.last_name || '',
                phone: profile?.phone || '',
            };
        } else if (role === 'seller' || role === 'supplier') {
            defaultValues = {
                ...defaultValues,
                name: profile?.user?.name || '',
                store_name: profile?.store_name || '',
                phone: profile?.phone || '',
                city: profile?.city || '',
                address: profile?.address || '',
                state: profile?.state || '',
                country: profile?.country || '',
                postal_code: profile?.postal_code || '',
                latitude: profile?.latitude || undefined,
                longitude: profile?.longitude || undefined,
                delivery_radius: profile?.delivery_radius || 10,
            };
        }

        reset(defaultValues);
        setInitialized(true);
    }, [profile, reset, initialized]);

    // ---------------- Submit handler ----------------
    const onSubmit = async (
        formData: z.infer<typeof createProfileSchema> | z.infer<typeof updateProfileSchema>
    ) => {
        setFormError(null);
        try {
            const payload: any = { ...formData };

            const roleMapping: Record<string, string> = {
                customer: 'customer',
                seller: 'vendor', // Backend uses 'vendor' but frontend shows 'seller'
                supplier: 'supplier',
            };
            payload.role = roleMapping[payload.user_type] || payload.user_type;
            delete payload.user_type;

            payload.password_confirmation = payload.confirm_password;
            delete payload.confirm_password;

            payload.storeName = payload.store_name;
            delete payload.store_name;

            // Map name field based on role
            if (payload.role === 'customer') {
                payload.name = payload.first_name || payload.name;
            } else if (payload.role === 'vendor' || payload.role === 'supplier') {
                // For seller/supplier, the 'name' field is the owner name, which should be the user's name
                // Backend expects 'name' to be the user's full name
                if (!payload.name || payload.name.trim() === '') {
                    // If name is not provided, try to construct from first_name and last_name
                    if (payload.first_name) {
                        payload.name = payload.first_name + (payload.last_name ? ' ' + payload.last_name : '');
                    } else {
                        // Last resort: use email prefix or store name
                        payload.name = payload.storeName || payload.email?.split('@')[0] || 'User';
                    }
                }
                // For seller/supplier, remove first_name and last_name as they're not needed
                delete payload.first_name;
                delete payload.last_name;
            }

            // Clean up fields that shouldn't be sent
            delete payload.status; // Backend handles this

            if (profile?.id) {
                if (!formData.password) {
                    delete payload.password;
                    delete payload.password_confirmation;
                }
                await updateProfile({ id: profile.id, ...payload }).unwrap();
            } else {
                // Remove user_id for new users - it shouldn't be sent
                delete payload.user_id;
                await createProfile(payload).unwrap();
            }

            enqueueSnackbar('Profile updated successfully', { variant: 'success' });
            setSuccessMessage(profile?.id ? 'Profile updated successfully!' : 'User created successfully!');
            setSuccessDialogOpen(true);

            if (profile?.id) {
                reset({
                    ...methods.getValues(),
                    password: '',
                    confirm_password: '',
                });
            } else {
                // If new user created, redirect to accounts
                setTimeout(() => router.push('/accounts'), 1500);
            }
        } catch (err: any) {
            console.error('Form submission error:', err);
            const errorMsg = err?.data?.message || err?.data?.errors || err?.error || 'Failed to save profile';
            const errorDetails = err?.data?.errors ? JSON.stringify(err.data.errors, null, 2) : '';
            const displayMsg = typeof errorMsg === 'string' ? errorMsg : 'Validation failed. Please check all required fields.';
            enqueueSnackbar(displayMsg, { variant: 'error' });
            setFormError(displayMsg + (errorDetails ? '\n' + errorDetails : ''));
        }
    };

    // ---------------- Delete handler ----------------
    const handleRemoveUser = () => {
        setConfirmDialogOpen(true);
    };

    const handleRemoveConfirmed = async () => {
        try {
            await deleteProfile(profile.id).unwrap();
            setConfirmDialogOpen(false);
            enqueueSnackbar('User deleted successfully', { variant: 'success' });
            router.push('/accounts');
        } catch (err: any) {
            enqueueSnackbar(err?.data?.message || 'Failed to delete user', { variant: 'error' });
        }
    };

    if (status === 'loading' || isLoading) return <FuseLoading />;

    return (
        <>
            <FormProvider {...methods}>
                <Root
                    header={
                        <UserHeader
                            onSubmit={handleSubmit(onSubmit)}
                            loading={creating || updating}
                            handleRemoveUser={handleRemoveUser}
                            isDeleting={isDeleting}
                            profileId={profile?.id}
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
                                onChange={(e: SyntheticEvent, val: string) => setTabValue(val)}
                            >
                                <FuseTab value="basic-info" label="User Info" />
                                {(watch('user_type') === 'seller' || watch('user_type') === 'supplier') && (
                                    <FuseTab value="location" label="Location" />
                                )}
                            </FuseTabs>

                            {tabValue === 'basic-info' && <BasicInfoTab />}
                            {tabValue === 'location' && (watch('user_type') === 'seller' || watch('user_type') === 'supplier') && <LocationTab />}
                        </motion.div>
                    }
                    scroll={isMobile ? 'normal' : 'content'}
                />
            </FormProvider>

            <SuccessDialog
                open={successDialogOpen}
                onClose={() => setSuccessDialogOpen(false)}
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

export default UserPage;
