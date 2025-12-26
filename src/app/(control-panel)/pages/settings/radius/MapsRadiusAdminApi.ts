import { apiServiceLaravel as api } from '@/store/apiServiceLaravel';

export const addTagTypes = ['admin_maps_radius_settings'] as const;

const MapsRadiusAdminApi = api
  .enhanceEndpoints({ addTagTypes })
  .injectEndpoints({
    endpoints: (build) => ({
      getAdminMapsRadiusSettings: build.query<GetAdminMapsRadiusSettingsResponse, void>({
        query: () => ({ url: `/api/admin/maps-radius-settings` }),
        providesTags: ['admin_maps_radius_settings'],
      }),
      updateAdminMapsRadiusSettings: build.mutation<UpdateAdminMapsRadiusSettingsResponse, UpdateAdminMapsRadiusSettingsArg>({
        query: (body) => ({ url: `/api/admin/maps-radius-settings`, method: 'PUT', body }),
        invalidatesTags: ['admin_maps_radius_settings'],
      }),
    }),
    overrideExisting: false,
  });

export default MapsRadiusAdminApi;

export type MapsRadiusSettings = {
  default_location_latitude: number;
  default_location_longitude: number;
  search_radius_km: number;
  google_maps_api_key: string;
};

export type GetAdminMapsRadiusSettingsResponse = {
  status: number;
  message: string;
  data: MapsRadiusSettings;
};

export type UpdateAdminMapsRadiusSettingsArg = Partial<MapsRadiusSettings>;
export type UpdateAdminMapsRadiusSettingsResponse = {
  status: number;
  message: string;
  data: MapsRadiusSettings;
};

export const {
  useGetAdminMapsRadiusSettingsQuery,
  useUpdateAdminMapsRadiusSettingsMutation,
} = MapsRadiusAdminApi;


