import { baseApi } from '@/services/baseApi';
import type { ApiResponse, Paginated, Review, ReviewListResponse } from '@/types';

export const reviewApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCourseReviews: builder.query<
      ReviewListResponse,
      { courseId: string; page?: number; limit?: number }
    >({
      query: ({ courseId, ...params }) => ({ url: `/reviews/course/${courseId}`, params }),
      transformResponse: (response: ApiResponse<ReviewListResponse>) => response.data,
      providesTags: (_result, _error, { courseId }) => [{ type: 'Review', id: courseId }],
    }),
    createReview: builder.mutation<
      { review: Review },
      { courseId: string; rating: number; comment: string }
    >({
      query: ({ courseId, ...body }) => ({ url: `/reviews/course/${courseId}`, method: 'POST', body }),
      transformResponse: (response: ApiResponse<{ review: Review }>) => response.data,
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: 'Review', id: courseId },
        { type: 'Review', id: 'ADMIN_LIST' },
        'CourseDetail',
        'Course',
      ],
    }),
    getAdminReviews: builder.query<
      Paginated<Review>,
      { page?: number; limit?: number; rating?: string; search?: string }
    >({
      query: (params) => ({ url: '/reviews/admin/all', params }),
      transformResponse: (response: ApiResponse<Paginated<Review>>) => response.data,
      providesTags: [{ type: 'Review', id: 'ADMIN_LIST' }],
    }),
    replyToReview: builder.mutation<{ review: Review }, { reviewId: string; content: string }>({
      query: ({ reviewId, content }) => ({
        url: `/reviews/${reviewId}/reply`,
        method: 'PATCH',
        body: { content },
      }),
      transformResponse: (response: ApiResponse<{ review: Review }>) => response.data,
      invalidatesTags: [
        { type: 'Review', id: 'ADMIN_LIST' },
        'Review',
        'CourseDetail',
      ],
    }),
    deleteReview: builder.mutation<null, string>({
      query: (reviewId) => ({ url: `/reviews/${reviewId}`, method: 'DELETE' }),
      transformResponse: (response: ApiResponse<null>) => response.data,
      invalidatesTags: ['Review', 'CourseDetail', 'Course'],
    }),
  }),
});

export const {
  useGetCourseReviewsQuery,
  useCreateReviewMutation,
  useGetAdminReviewsQuery,
  useReplyToReviewMutation,
  useDeleteReviewMutation,
} = reviewApi;
