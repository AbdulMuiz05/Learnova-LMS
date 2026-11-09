import { baseApi } from '@/services/baseApi';
import type { ApiResponse, UploadSignature, UploadStatus } from '@/types';

export interface SignedUploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

export const uploadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUploadStatus: builder.query<UploadStatus, void>({
      query: () => '/uploads/status',
      transformResponse: (response: ApiResponse<UploadStatus>) => response.data,
      providesTags: ['Uploads'],
    }),
    getUploadSignature: builder.mutation<
      UploadSignature,
      { resourceType: 'image' | 'video'; folder: string }
    >({
      query: (body) => ({ url: '/uploads/signature', method: 'POST', body }),
      transformResponse: (response: ApiResponse<UploadSignature>) => response.data,
    }),
    uploadImage: builder.mutation<SignedUploadResult, { formData: FormData }>({
      query: ({ formData }) => ({ url: '/uploads/image', method: 'POST', body: formData }),
      transformResponse: (response: ApiResponse<SignedUploadResult>) => response.data,
      invalidatesTags: ['Uploads'],
    }),
  }),
});

export const {
  useGetUploadStatusQuery,
  useGetUploadSignatureMutation,
  useUploadImageMutation,
} = uploadApi;
