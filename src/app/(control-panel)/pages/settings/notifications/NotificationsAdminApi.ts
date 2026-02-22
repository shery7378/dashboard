import { apiServiceLaravel as api } from '@/store/apiServiceLaravel';

export const addTagTypes = ['admin_notification_settings'] as const;

const NotificationsAdminApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
	endpoints: (build) => ({
		getAdminNotificationSettings: build.query<GetAdminNotificationSettingsResponse, void>({
			query: () => ({ url: `/api/admin/notification-settings` }),
			providesTags: ['admin_notification_settings']
		}),
		updateAdminNotificationSettings: build.mutation<
			UpdateAdminNotificationSettingsResponse,
			UpdateAdminNotificationSettingsArg
		>({
			query: (body) => ({ url: `/api/admin/notification-settings`, method: 'PUT', body }),
			invalidatesTags: ['admin_notification_settings']
		}),
		testAdminNotification: build.mutation<TestAdminNotificationResponse, TestAdminNotificationArg>({
			query: (body) => ({ url: `/api/admin/notification-settings/test`, method: 'POST', body })
		})
	}),
	overrideExisting: false
});

export default NotificationsAdminApi;

export type NotificationSettings = {
	id: number;
	enabled: boolean;
	email_enabled: boolean;
	sms_enabled: boolean;
	created_at: string;
	updated_at: string;
};

export type GetAdminNotificationSettingsResponse = {
	status: number;
	message: string;
	data: NotificationSettings;
};

export type UpdateAdminNotificationSettingsArg = Pick<
	NotificationSettings,
	'enabled' | 'email_enabled' | 'sms_enabled'
>;
export type UpdateAdminNotificationSettingsResponse = {
	status: number;
	message: string;
	data: NotificationSettings;
};

export type TestAdminNotificationArg = { channel: 'email' | 'sms'; target?: string };
export type TestAdminNotificationResponse = { status: number; message: string };

export const {
	useGetAdminNotificationSettingsQuery,
	useUpdateAdminNotificationSettingsMutation,
	useTestAdminNotificationMutation
} = NotificationsAdminApi;
