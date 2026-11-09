import { baseApi } from '@/services/baseApi';
import type {
  AdminAnalytics,
  AdminStats,
  AdminUserDetail,
  ApiResponse,
  Paginated,
  User,
  UserRole,
} from '@/types';

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminStats: builder.query<AdminStats, void>({
      query: () => '/admin/stats',
      transformResponse: (response: ApiResponse<AdminStats>) => response.data,
      providesTags: ['AdminStats'],
    }),
    getAdminAnalytics: builder.query<AdminAnalytics, void>({
      query: () => '/admin/analytics',
      transformResponse: (response: ApiResponse<AdminAnalytics>) => response.data,
      providesTags: ['AdminAnalytics'],
    }),
    getAdminUsers: builder.query<
      Paginated<User>,
      { page?: number; limit?: number; search?: string; role?: string; active?: string }
    >({
      query: (params) => ({ url: '/admin/users', params }),
      transformResponse: (response: ApiResponse<Paginated<User>>) => response.data,
      providesTags: ['AdminUsers'],
    }),
    getAdminUserDetail: builder.query<AdminUserDetail, string>({
      query: (userId) => `/admin/users/${userId}`,
      transformResponse: (response: ApiResponse<AdminUserDetail>) => response.data,
      providesTags: (_result, _error, userId) => [{ type: 'AdminUsers', id: userId }],
    }),
    updateAdminUser: builder.mutation<
      { user: User },
      { userId: string; body: { role?: UserRole; isActive?: boolean } }
    >({
      query: ({ userId, body }) => ({ url: `/admin/users/${userId}`, method: 'PATCH', body }),
      transformResponse: (response: ApiResponse<{ user: User }>) => response.data,
      invalidatesTags: ['AdminUsers', 'AdminStats'],
    }),
  }),
});

export const {
  useGetAdminStatsQuery,
  useGetAdminAnalyticsQuery,
  useGetAdminUsersQuery,
  useGetAdminUserDetailQuery,
  useUpdateAdminUserMutation,
} = adminApi;
