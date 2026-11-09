import { baseApi } from '@/services/baseApi';
import type {
  AdminCourseDetail,
  ApiResponse,
  Course,
  CourseDetail,
  CourseLevel,
  CourseStatus,
  LearnCourseResponse,
  Lesson,
  LessonContent,
  LessonResource,
  Paginated,
  Section,
} from '@/types';

export interface CourseQueryParams {
  search?: string;
  category?: string;
  level?: string;
  sort?: string;
  featured?: string;
  page?: number;
  limit?: number;
}

export interface AdminCourseQueryParams {
  search?: string;
  status?: string;
  level?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface CoursePayload {
  title: string;
  description: string;
  shortDescription: string;
  category: string;
  level: CourseLevel;
  price: number;
  discountPrice: number | null;
  benefits: string[];
  requirements: string[];
  language?: string;
  featured?: boolean;
  status?: CourseStatus;
  instructor?: {
    name: string;
    title: string;
    bio: string;
    avatar: string;
  };
  thumbnail?: { url: string; publicId: string };
}

export interface LessonPayload {
  title: string;
  description?: string;
  duration?: number;
  resources?: LessonResource[];
  isPreview?: boolean;
  section?: string;
  video?: {
    publicId?: string;
    provider?: 'cloudinary' | 'external';
    type?: 'upload' | 'authenticated';
    url?: string;
    duration?: number;
    poster?: string;
  };
}

export const courseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCourses: builder.query<Paginated<Course>, CourseQueryParams | void>({
      query: (params) => ({ url: '/courses', params: params || {} }),
      transformResponse: (response: ApiResponse<Paginated<Course>>) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ _id }) => ({ type: 'Course' as const, id: _id })),
              { type: 'Course', id: 'LIST' },
            ]
          : [{ type: 'Course', id: 'LIST' }],
    }),
    getCourse: builder.query<CourseDetail, string>({
      query: (slug) => `/courses/${slug}`,
      transformResponse: (response: ApiResponse<CourseDetail>) => response.data,
      providesTags: (_result, _error, slug) => [{ type: 'CourseDetail', id: slug }],
    }),
    getAdminCourses: builder.query<Paginated<Course>, AdminCourseQueryParams | void>({
      query: (params) => ({ url: '/courses/admin/all', params: params || {} }),
      transformResponse: (response: ApiResponse<Paginated<Course>>) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ _id }) => ({ type: 'Course' as const, id: _id })),
              { type: 'Course', id: 'ADMIN_LIST' },
            ]
          : [{ type: 'Course', id: 'ADMIN_LIST' }],
    }),
    getCourseStats: builder.query<{ sections: number; lessons: number }, string>({
      query: (courseId) => `/courses/${courseId}/stats`,
      transformResponse: (response: ApiResponse<{ sections: number; lessons: number }>) => response.data,
    }),
    createCourse: builder.mutation<{ course: Course }, CoursePayload>({
      query: (body) => ({ url: '/courses', method: 'POST', body }),
      transformResponse: (response: ApiResponse<{ course: Course }>) => response.data,
      invalidatesTags: [
        { type: 'Course', id: 'ADMIN_LIST' },
        { type: 'Course', id: 'LIST' },
        'Homepage',
      ],
    }),
    updateCourse: builder.mutation<{ course: Course }, { id: string; body: Partial<CoursePayload> }>({
      query: ({ id, body }) => ({ url: `/courses/${id}`, method: 'PATCH', body }),
      transformResponse: (response: ApiResponse<{ course: Course }>) => response.data,
      invalidatesTags: ['Course', 'CourseDetail', 'Curriculum', 'Homepage'],
    }),
    deleteCourse: builder.mutation<null, string>({
      query: (id) => ({ url: `/courses/${id}`, method: 'DELETE' }),
      transformResponse: (response: ApiResponse<null>) => response.data,
      invalidatesTags: ['Course', 'CourseDetail', 'Homepage'],
    }),
    setCourseStatus: builder.mutation<{ course: Course }, { id: string; status: CourseStatus }>({
      query: ({ id, status }) => ({ url: `/courses/${id}/status`, method: 'PATCH', body: { status } }),
      transformResponse: (response: ApiResponse<{ course: Course }>) => response.data,
      invalidatesTags: ['Course', 'CourseDetail', 'Homepage'],
    }),
    uploadCourseThumbnail: builder.mutation<{ course: Course }, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({ url: `/courses/${id}/thumbnail`, method: 'POST', body: formData }),
      transformResponse: (response: ApiResponse<{ course: Course }>) => response.data,
      invalidatesTags: ['Course', 'CourseDetail', 'Homepage'],
    }),
    getAdminCurriculum: builder.query<AdminCourseDetail, string>({
      query: (courseId) => `/courses/${courseId}/curriculum`,
      transformResponse: (response: ApiResponse<AdminCourseDetail>) => response.data,
      providesTags: (_result, _error, courseId) => [{ type: 'Curriculum', id: courseId }],
    }),
    createSection: builder.mutation<{ section: Section }, { courseId: string; title: string }>({
      query: ({ courseId, title }) => ({
        url: `/courses/${courseId}/sections`,
        method: 'POST',
        body: { title },
      }),
      transformResponse: (response: ApiResponse<{ section: Section }>) => response.data,
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: 'Curriculum', id: courseId },
        'Course',
        'CourseDetail',
      ],
    }),
    updateSection: builder.mutation<{ section: Section }, { sectionId: string; courseId: string; title: string }>({
      query: ({ sectionId, title }) => ({
        url: `/sections/${sectionId}`,
        method: 'PATCH',
        body: { title },
      }),
      transformResponse: (response: ApiResponse<{ section: Section }>) => response.data,
      invalidatesTags: (_result, _error, { courseId }) => [{ type: 'Curriculum', id: courseId }, 'CourseDetail'],
    }),
    deleteSection: builder.mutation<null, { sectionId: string; courseId: string }>({
      query: ({ sectionId }) => ({ url: `/sections/${sectionId}`, method: 'DELETE' }),
      transformResponse: (response: ApiResponse<null>) => response.data,
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: 'Curriculum', id: courseId },
        'Course',
        'CourseDetail',
      ],
    }),
    reorderSections: builder.mutation<null, { courseId: string; orderedIds: string[] }>({
      query: ({ courseId, orderedIds }) => ({
        url: `/courses/${courseId}/sections/reorder`,
        method: 'PUT',
        body: { orderedIds },
      }),
      transformResponse: (response: ApiResponse<null>) => response.data,
      invalidatesTags: (_result, _error, { courseId }) => [{ type: 'Curriculum', id: courseId }, 'CourseDetail'],
    }),
    createLesson: builder.mutation<{ lesson: Lesson }, { sectionId: string; courseId: string; body: LessonPayload }>({
      query: ({ sectionId, body }) => ({
        url: `/sections/${sectionId}/lessons`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<{ lesson: Lesson }>) => response.data,
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: 'Curriculum', id: courseId },
        'Course',
        'CourseDetail',
      ],
    }),
    updateLesson: builder.mutation<{ lesson: Lesson }, { lessonId: string; courseId: string; body: Partial<LessonPayload> }>({
      query: ({ lessonId, body }) => ({
        url: `/lessons/${lessonId}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: ApiResponse<{ lesson: Lesson }>) => response.data,
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: 'Curriculum', id: courseId },
        'Course',
        'CourseDetail',
      ],
    }),
    deleteLesson: builder.mutation<null, { lessonId: string; courseId: string }>({
      query: ({ lessonId }) => ({ url: `/lessons/${lessonId}`, method: 'DELETE' }),
      transformResponse: (response: ApiResponse<null>) => response.data,
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: 'Curriculum', id: courseId },
        'Course',
        'CourseDetail',
      ],
    }),
    reorderLessons: builder.mutation<null, { courseId: string; orderedIds: string[] }>({
      query: ({ courseId, orderedIds }) => ({
        url: `/courses/${courseId}/lessons/reorder`,
        method: 'PUT',
        body: { orderedIds },
      }),
      transformResponse: (response: ApiResponse<null>) => response.data,
      invalidatesTags: (_result, _error, { courseId }) => [{ type: 'Curriculum', id: courseId }, 'CourseDetail'],
    }),
    getLessonContent: builder.query<LessonContent, string>({
      query: (lessonId) => `/lessons/${lessonId}/content`,
      transformResponse: (response: ApiResponse<LessonContent>) => response.data,
    }),
    completeLesson: builder.mutation<{ enrollment: { progress: number; completedLessons: string[] } }, string>({
      query: (lessonId) => ({ url: `/lessons/${lessonId}/complete`, method: 'POST' }),
      transformResponse: (response: ApiResponse<{ enrollment: { progress: number; completedLessons: string[] } }>) =>
        response.data,
      invalidatesTags: ['Enrollment'],
    }),
    getLearnCourse: builder.query<LearnCourseResponse, string>({
      query: (courseId) => `/courses/${courseId}/learn`,
      transformResponse: (response: ApiResponse<LearnCourseResponse>) => response.data,
      providesTags: ['Enrollment'],
    }),
  }),
});

export const {
  useGetCoursesQuery,
  useGetCourseQuery,
  useGetAdminCoursesQuery,
  useGetCourseStatsQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useSetCourseStatusMutation,
  useUploadCourseThumbnailMutation,
  useGetAdminCurriculumQuery,
  useCreateSectionMutation,
  useUpdateSectionMutation,
  useDeleteSectionMutation,
  useReorderSectionsMutation,
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useDeleteLessonMutation,
  useReorderLessonsMutation,
  useGetLessonContentQuery,
  useCompleteLessonMutation,
  useGetLearnCourseQuery,
} = courseApi;
