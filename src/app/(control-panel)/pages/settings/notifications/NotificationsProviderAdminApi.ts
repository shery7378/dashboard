import { apiServiceLaravel as api } from '@/store/apiServiceLaravel';

export const addTagTypes = ['admin_notification_provider_settings'] as const;

const NotificationsProviderAdminApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
	endpoints: (build) => ({
		getAdminNotificationProviderSettings: build.query<GetAdminNotificationProviderSettingsResponse, void>({
			query: () => ({ url: `/api/admin/notification-provider-settings` }),
			providesTags: ['admin_notification_provider_settings']
		}),
		updateAdminNotificationProviderSettings: build.mutation<
			UpdateAdminNotificationProviderSettingsResponse,
			UpdateAdminNotificationProviderSettingsArg
		>({
			query: (body) => ({ url: `/api/admin/notification-provider-settings`, method: 'PUT', body }),
			invalidatesTags: ['admin_notification_provider_settings']
		}),
		sendNotificationTest: build.mutation<SendNotificationTestResponse, SendNotificationTestArg | void>({
			query: (body) => ({
				url: `/api/admin/notification-provider-settings/test`,
				method: 'POST',
				body: body ?? {}
			})
		})
	}),
	overrideExisting: false
});

export default NotificationsProviderAdminApi;

export type NotificationProviderSettings = {
	id: number;
	email_from_name?: string | null;
	email_from_address?: string | null;
	sms_provider?: 'twilio' | 'vonage' | 'messagebird' | 'custom' | null;
	sms_api_key?: string | null;
	sms_api_secret?: string | null;
	sms_sender_id?: string | null;
	mail_mailer?: string | null;
	mail_scheme?: string | null;
	mail_host?: string | null;
	mail_port?: number | null;
	mail_username?: string | null;
	mail_password?: string | null;
	mail_from_address?: string | null;
	mail_from_name?: string | null;
	created_at: string;
	updated_at: string;
};

export type GetAdminNotificationProviderSettingsResponse = {
	status: number;
	message: string;
	data: NotificationProviderSettings;
};

export type UpdateAdminNotificationProviderSettingsArg = Partial<
	Pick<
		NotificationProviderSettings,
		| 'email_from_name'
		| 'email_from_address'
		| 'sms_provider'
		| 'sms_api_key'
		| 'sms_api_secret'
		| 'sms_sender_id'
		| 'mail_mailer'
		| 'mail_scheme'
		| 'mail_host'
		| 'mail_port'
		| 'mail_username'
		| 'mail_password'
		| 'mail_from_address'
		| 'mail_from_name'
	>
>;
export type UpdateAdminNotificationProviderSettingsResponse = {
	status: number;
	message: string;
	data: NotificationProviderSettings;
};

export type SendNotificationTestArg = { channel?: 'email' | 'sms'; to?: string; message?: string };
export type SendNotificationTestResponse = { status: number; message: string };

export const {
	useGetAdminNotificationProviderSettingsQuery,
	useUpdateAdminNotificationProviderSettingsMutation,
	useSendNotificationTestMutation
} = NotificationsProviderAdminApi;
