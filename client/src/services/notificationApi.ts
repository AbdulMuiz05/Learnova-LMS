import { baseApi } from '@/services/baseApi';
import type { ApiResponse, NotificationListResponse } from '@/types';

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      NotificationListResponse,
      { page?: number; limit?: number; unread?: boolean } | void
    >({
      query: (params) => ({
        url: '/notifications',
        params: params
          ? {
              page: params.page,
              limit: params.limit,
              unread: params.unread ? 'true' : undefined,
            }
          : {},
      }),
      transformResponse: (response: ApiResponse<NotificationListResponse>) => response.data,
      providesTags: ['Notification'],
    }),
    getUnreadCount: builder.query<{ unread: number }, void>({
      query: () => '/notifications/unread-count',
      transformResponse: (response: ApiResponse<{ unread: number }>) => response.data,
      providesTags: ['Notification'],
    }),
    markNotificationRead: builder.mutation<{ unread: number }, string>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: 'PATCH',
      }),
      transformResponse: (response: ApiResponse<{ unread: number }>) => response.data,
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsRead: builder.mutation<{ unread: number }, void>({
      query: () => ({ url: '/notifications/read-all', method: 'PATCH' }),
      transformResponse: (response: ApiResponse<{ unread: number }>) => response.data,
      invalidatesTags: ['Notification'],
    }),
    clearNotifications: builder.mutation<{ deleted: number }, void>({
      query: () => ({ url: '/notifications', method: 'DELETE' }),
      transformResponse: (response: ApiResponse<{ deleted: number }>) => response.data,
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useClearNotificationsMutation,
} = notificationApi;
