'use client';

import { apiServiceLaravel as api } from '@/store/apiServiceLaravel';
import { PartialDeep } from 'type-fest';

// Tags for cache invalidation and auto-refetching
export const addTagTypes = ['Profiles', 'Profile'] as const;

// Enhance base API with tag support
const ProfileLaravelApi = api
    .enhanceEndpoints({ addTagTypes })
    .injectEndpoints({
        endpoints: (build) => ({
            /** ------------------------------
             *  PROFILE ENDPOINTS
             * ------------------------------ */

            // Get all profiles (paginated)
            getProfiles: build.query<GetProfilesApiResponse, GetProfilesApiArg>({
                query: ({ page = 1, perPage = 10 } = {}) => ({
                    url: `/api/profiles`,
                    params: { page, per_page: perPage },
                }),
                providesTags: ['Profiles'],
            }),

            // Get profiles by role (paginated)
            getProfilesByRole: build.query<GetProfilesApiResponse, GetProfilesByRoleApiArg>({
                query: ({ role, page = 1, perPage = 10 }) => ({
                    url: `/api/profiles`,
                    params: { role, page, per_page: perPage },
                }),
                providesTags: ['Profiles'],
            }),

            // Get single profile by ID
            getProfile: build.query<GetProfileApiResponse, GetProfileApiArg>({
                query: (profileId) => ({
                    url: `/api/profiles/${profileId}`,
                }),
                providesTags: ['Profile', 'Profiles'],
            }),

            // Create a new profile
            createProfile: build.mutation<CreateProfileApiResponse, CreateProfileApiArg>({
                query: (newProfile) => ({
                    url: `/api/profiles`,
                    method: 'POST',
                    body: newProfile,
                }),
                invalidatesTags: ['Profiles', 'Profile'],
            }),

            // Update an existing profile
            updateProfile: build.mutation<UpdateProfileApiResponse, UpdateProfileApiArg & { id: string }>({
                query: ({ id, ...profile }) => ({
                    url: `/api/profiles/${id}`,
                    method: 'PUT',
                    body: profile,
                }),
                invalidatesTags: ['Profile', 'Profiles'],
            }),

            // Delete a single profile
            deleteProfile: build.mutation<DeleteProfileApiResponse, DeleteProfileApiArg>({
                query: (profileId) => ({
                    url: `/api/profiles/${profileId}`,
                    method: 'DELETE',
                }),
                invalidatesTags: ['Profile', 'Profiles'],
            }),

            // Update password
            updatePassword: build.mutation<UpdatePasswordApiResponse, UpdatePasswordApiArg>({
                query: ({ current_password, new_password, new_password_confirmation }) => ({
                    url: '/api/auth/update-password',
                    method: 'PUT',
                    body: {
                        current_password,
                        new_password,
                        new_password_confirmation,
                    },
                }),
            }),

            // Add a new user
            createUser: build.mutation<CreateUserApiResponse, CreateUserApiArg>({
                query: (newProfile) => ({
                    url: `/api/add_user`,
                    method: 'POST',
                    body: newProfile,
                }),
                invalidatesTags: ['Profiles', 'Profile'],
            }),

            // Reset password for a user (admin action)
            resetUserPassword: build.mutation<ResetUserPasswordApiResponse, ResetUserPasswordApiArg>({
                query: (userId) => ({
                    url: `/api/users/${userId}/reset-password`,
                    method: 'POST',
                }),
            }),
        }),
        overrideExisting: false,
    });

export default ProfileLaravelApi;

/** -----------------------------------------------------------------
 * PROFILE TYPES
 * ----------------------------------------------------------------- */

export type GetProfilesApiResponse = {
    status: number;
    message: string;
    data: Profile[];
    pagination: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
};
export type GetProfilesApiArg = { page?: number; perPage?: number };

export type GetProfilesByRoleApiArg = { role: string; page?: number; perPage?: number };

export type GetProfileApiResponse = {
    status: number;
    message: string;
    data: Profile;
};
export type GetProfileApiArg = string;

export type CreateProfileApiResponse = {
    status: number;
    message: string;
    data: Profile;
};
export type CreateProfileApiArg = PartialDeep<Profile>;

export type CreateUserApiResponse = {
    status: number;
    message: string;
    data: Profile;
};
export type CreateUserApiArg = PartialDeep<Profile>;

export type UpdateProfileApiResponse = {
    status: number;
    message: string;
    data: Profile;
};
export type UpdateProfileApiArg = PartialDeep<Profile>;

export type DeleteProfileApiResponse = {
    status: number;
    message: string;
    data: null;
};
export type DeleteProfileApiArg = string;

export type UpdatePasswordApiResponse = {
    status: number;
    message: string;
    data: null;
};
export type UpdatePasswordApiArg = {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
};

export type ResetUserPasswordApiResponse = {
    status: number;
    message: string;
    data: null;
};
export type ResetUserPasswordApiArg = string;

export type Profile = {
    id: string;
    user_id: string;
    user: {
        id: string;
        name: string;
        email: string;
        roles: string[];
    };
    store_name: string | null;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    image: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postal_code: string | null;
    company_name: string | null;
    tax_id: string | null;
    bank_account: string | null;
    website: string | null;
    dob: string | null;
    gender: 'male' | 'female' | 'other' | null;
    latitude: number | null;
    longitude: number | null;
    status: 'active' | 'suspended' | 'pending' | 'inactive' | null;
    admin_comment: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
};

/** -----------------------------------------------------------------
 * RTK HOOK EXPORTS
 * ----------------------------------------------------------------- */

export const {
    useGetProfilesQuery,
    useGetProfilesByRoleQuery,
    useGetProfileQuery,
    useCreateProfileMutation,
    useUpdateProfileMutation,
    useDeleteProfileMutation,
    useUpdatePasswordMutation,
    useCreateUserMutation,
    useResetUserPasswordMutation,
} = ProfileLaravelApi;

// Optional: for Redux integration
export type ProfileLaravelApiType = {
    [ProfileLaravelApi.reducerPath]: ReturnType<typeof ProfileLaravelApi.reducer>;
};