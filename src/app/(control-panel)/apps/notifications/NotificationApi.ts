import { apiServiceLaravel as api } from '@/store/apiServiceLaravel';
import { ReactNode } from 'react';

export const addTagTypes = ['notifications', 'notification'] as const;

const NotificationApi = api
	.enhanceEndpoints({
		addTagTypes
	})
	.injectEndpoints({
		endpoints: (build) => ({
			getAllNotifications: build.query<GetAllNotificationsApiResponse, GetAllNotificationsApiArg>({
				query: () => ({ url: `/api/notifications` }),
				transformResponse: (response: { data?: Notification[] }) => {
					// Handle Laravel API response format { data: [...] }
					return response.data || response || [];
				},
				providesTags: ['notifications']
			}),
			createNotification: build.mutation<CreateNotificationApiResponse, CreateNotificationApiArg>({
				query: (notification) => ({
					url: `/api/mock/notifications`,
					method: 'POST',
					body: notification
				}),
				invalidatesTags: ['notifications'],
				// Since we're using Laravel notifications, mock notifications are not needed
				// This will fail silently if the mock endpoint doesn't exist
				async onQueryStarted(arg, { queryFulfilled }) {
					try {
						await queryFulfilled;
					} catch (error) {
						// Silently ignore errors for mock notifications
						// Laravel notifications are handled separately
						console.debug('Mock notification creation failed (expected if using Laravel notifications):', error);
					}
				}
			}),
			deleteNotifications: build.mutation<DeleteNotificationsApiResponse, DeleteNotificationsApiArg>({
				query: (notificationIds) => ({
					url: `/api/mock/notifications`,
					method: 'DELETE',
					body: notificationIds
				}),
				invalidatesTags: ['notifications'],
				// Since we're using Laravel notifications, mock notification deletion is not needed
				async onQueryStarted(arg, { queryFulfilled }) {
					try {
						await queryFulfilled;
					} catch (error) {
						// Silently ignore errors for mock notifications
						console.debug('Mock notification deletion failed (expected if using Laravel notifications):', error);
					}
				}
			}),
			getNotification: build.query<GetNotificationApiResponse, GetNotificationApiArg>({
				query: (notificationId) => ({
					url: `/api/mock/notifications/${notificationId}`
				}),
				providesTags: ['notification']
				// Note: This will fail if mock endpoint doesn't exist, but that's expected
				// since we're using Laravel notifications. The query can be skipped at the hook level.
			}),
			deleteNotification: build.mutation<DeleteNotificationApiResponse, DeleteNotificationApiArg>({
				query: (notificationId) => ({
					url: `/api/notifications/${notificationId}/read`,
					method: 'POST'
				}),
				invalidatesTags: ['notifications']
			})
		}),
		overrideExisting: false
	});
export default NotificationApi;

export type GetAllNotificationsApiResponse = /** status 200 OK */ Notification[];
export type GetAllNotificationsApiArg = void;

export type CreateNotificationApiResponse = unknown;
export type CreateNotificationApiArg = Notification;

export type DeleteNotificationsApiResponse = unknown;
export type DeleteNotificationsApiArg = string[];

export type GetNotificationApiResponse = /** status 200 OK */ Notification;
export type GetNotificationApiArg = string; /** notification id */

export type DeleteNotificationApiResponse = unknown;
export type DeleteNotificationApiArg = string; /** notification id */

export type Notification = {
	id?: string;
	icon?: string;
	title?: string;
	description?: string;
	time?: string;
	read?: boolean;
	link?: string;
	useRouter?: boolean;
	variant?: 'success' | 'info' | 'error' | 'warning' | 'alert' | 'primary' | 'secondary';
	image?: string;
	children?: ReactNode;
};

export const {
	useGetAllNotificationsQuery,
	useCreateNotificationMutation,
	useDeleteNotificationsMutation,
	useGetNotificationQuery,
	useDeleteNotificationMutation
} = NotificationApi;
