import { baseApi } from '@/services/baseApi';
import type { ApiResponse, CurriculumResponse, Enrollment, MyEnrollmentsResponse } from '@/types';

export const enrollmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyEnrollments: builder.query<MyEnrollmentsResponse, void>({
      query: () => '/enrollments/my',
      transformResponse: (response: ApiResponse<MyEnrollmentsResponse>) => response.data,
      providesTags: ['Enrollment'],
    }),
    getCourseProgress: builder.query<CurriculumResponse, string>({
      query: (courseId) => `/enrollments/course/${courseId}`,
      transformResponse: (response: ApiResponse<CurriculumResponse>) => response.data,
      providesTags: ['Enrollment'],
    }),
    getEnrollmentById: builder.query<{ enrollment: Enrollment }, string>({
      query: (enrollmentId) => `/enrollments/${enrollmentId}`,
      transformResponse: (response: ApiResponse<{ enrollment: Enrollment }>) => response.data,
      providesTags: ['Enrollment'],
    }),
  }),
});

export const {
  useGetMyEnrollmentsQuery,
  useGetCourseProgressQuery,
  useGetEnrollmentByIdQuery,
} = enrollmentApi;
