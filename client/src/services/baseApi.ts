import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { clearCredentials } from '@/features/auth/authSlice';

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
export const SOCKET_URL = (
  process.env.NEXT_PUBLIC_SOCKET_URL || API_URL.replace(/\/api\/?$/, '')
).replace(/\/$/, '');

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: 'include',
  prepareHeaders: (headers) => {
    headers.set('Accept', 'application/json');
    return headers;
  },
});

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(
  args: string | FetchArgs,
  api: Parameters<BaseQueryFn>[1],
  extraOptions: Parameters<BaseQueryFn>[2]
): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const result = await rawBaseQuery(
        { url: '/auth/refresh', method: 'POST' },
        api,
        extraOptions
      );
      return !result.error;
    })();
    refreshPromise.finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  const url = typeof args === 'string' ? args : args.url;
  const isPublicAuthCall =
    url.startsWith('/auth/login') ||
    url.startsWith('/auth/register') ||
    url.startsWith('/auth/refresh') ||
    url.startsWith('/auth/verify-otp') ||
    url.startsWith('/auth/resend-otp') ||
    url.startsWith('/auth/forgot-password') ||
    url.startsWith('/auth/reset-password');

  if (result.error?.status === 401 && !isPublicAuthCall) {
    const refreshed = await refreshSession(args, api, extraOptions);
    if (refreshed) {
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(clearCredentials());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Course',
    'CourseDetail',
    'Curriculum',
    'Category',
    'Enrollment',
    'Order',
    'Review',
    'Question',
    'Notification',
    'AdminStats',
    'AdminAnalytics',
    'AdminUsers',
    'Homepage',
    'Faq',
    'SiteSettings',
    'Uploads',
  ],
  endpoints: () => ({}),
});
