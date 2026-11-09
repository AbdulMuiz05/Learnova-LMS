import { baseApi } from '@/services/baseApi';
import type { ApiResponse, Avatar, User } from '@/types';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResult {
  email: string;
  verificationRequired: boolean;
  devOtp?: string;
  emailDeliveryConfigured: boolean;
}

export interface OtpResult {
  devOtp?: string;
  emailDeliveryConfigured: boolean;
}

export interface VerifyOtpPayload {
  email: string;
  code: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  password: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<RegisterResult, RegisterPayload>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      transformResponse: (response: ApiResponse<RegisterResult>) => response.data,
    }),
    login: builder.mutation<{ user: User }, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      transformResponse: (response: ApiResponse<{ user: User }>) => response.data,
    }),
    verifyOtp: builder.mutation<{ user: User; alreadyVerified?: boolean }, VerifyOtpPayload>({
      query: (body) => ({ url: '/auth/verify-otp', method: 'POST', body }),
      transformResponse: (response: ApiResponse<{ user: User; alreadyVerified?: boolean }>) => response.data,
    }),
    resendOtp: builder.mutation<OtpResult, { email: string; purpose?: 'verify' | 'reset' }>({
      query: (body) => ({ url: '/auth/resend-otp', method: 'POST', body }),
      transformResponse: (response: ApiResponse<OtpResult>) => response.data,
    }),
    forgotPassword: builder.mutation<OtpResult, { email: string }>({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
      transformResponse: (response: ApiResponse<OtpResult>) => response.data,
    }),
    resetPassword: builder.mutation<null, ResetPasswordPayload>({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
      transformResponse: (response: ApiResponse<null>) => response.data,
    }),
    getMe: builder.query<{ user: User }, void>({
      query: () => '/auth/me',
      transformResponse: (response: ApiResponse<{ user: User }>) => response.data,
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation<{ user: User }, { name?: string; bio?: string }>({
      query: (body) => ({ url: '/auth/me', method: 'PATCH', body }),
      transformResponse: (response: ApiResponse<{ user: User }>) => response.data,
      invalidatesTags: ['User'],
    }),
    changePassword: builder.mutation<null, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: '/auth/me/password', method: 'PATCH', body }),
      transformResponse: (response: ApiResponse<null>) => response.data,
    }),
    uploadAvatar: builder.mutation<{ avatar: Avatar; user: User }, FormData>({
      query: (formData) => ({ url: '/auth/me/avatar', method: 'POST', body: formData }),
      transformResponse: (response: ApiResponse<{ avatar: Avatar; user: User }>) => response.data,
      invalidatesTags: ['User'],
    }),
    deleteAvatar: builder.mutation<{ user: User }, void>({
      query: () => ({ url: '/auth/me/avatar', method: 'DELETE' }),
      transformResponse: (response: ApiResponse<{ user: User }>) => response.data,
      invalidatesTags: ['User'],
    }),
    logout: builder.mutation<null, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      transformResponse: (response: ApiResponse<null>) => response.data,
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useUploadAvatarMutation,
  useDeleteAvatarMutation,
  useLogoutMutation,
} = authApi;
