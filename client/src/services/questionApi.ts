import { baseApi } from '@/services/baseApi';
import type { ApiResponse, Paginated, Question } from '@/types';

interface AdminQuestionsResponse extends Paginated<Question> {
  unanswered: number;
}

export const questionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLessonQuestions: builder.query<Paginated<Question>, { lessonId: string; page?: number }>({
      query: ({ lessonId, ...params }) => ({ url: `/questions/lesson/${lessonId}`, params }),
      transformResponse: (response: ApiResponse<Paginated<Question>>) => response.data,
      providesTags: (_result, _error, { lessonId }) => [{ type: 'Question', id: lessonId }],
    }),
    getCourseQuestions: builder.query<{ items: Question[] }, string>({
      query: (courseId) => `/questions/course/${courseId}`,
      transformResponse: (response: ApiResponse<{ items: Question[] }>) => response.data,
      providesTags: [{ type: 'Question', id: 'COURSE' }],
    }),
    askQuestion: builder.mutation<{ question: Question }, { lessonId: string; content: string }>({
      query: (body) => ({ url: '/questions', method: 'POST', body }),
      transformResponse: (response: ApiResponse<{ question: Question }>) => response.data,
      invalidatesTags: (_result, _error, { lessonId }) => [
        { type: 'Question', id: lessonId },
        { type: 'Question', id: 'ADMIN_LIST' },
      ],
    }),
    getAdminQuestions: builder.query<
      AdminQuestionsResponse,
      { page?: number; status?: string; search?: string }
    >({
      query: (params) => ({ url: '/questions/admin/all', params }),
      transformResponse: (response: ApiResponse<AdminQuestionsResponse>) => response.data,
      providesTags: [{ type: 'Question', id: 'ADMIN_LIST' }],
    }),
    answerQuestion: builder.mutation<{ question: Question }, { questionId: string; content: string }>({
      query: ({ questionId, content }) => ({
        url: `/questions/${questionId}/answers`,
        method: 'POST',
        body: { content },
      }),
      transformResponse: (response: ApiResponse<{ question: Question }>) => response.data,
      invalidatesTags: [
        { type: 'Question', id: 'ADMIN_LIST' },
        'Question',
      ],
    }),
    resolveQuestion: builder.mutation<
      { question: Question },
      { questionId: string; isResolved: boolean }
    >({
      query: ({ questionId, isResolved }) => ({
        url: `/questions/${questionId}/resolve`,
        method: 'PATCH',
        body: { isResolved },
      }),
      transformResponse: (response: ApiResponse<{ question: Question }>) => response.data,
      invalidatesTags: [
        { type: 'Question', id: 'ADMIN_LIST' },
        'Question',
      ],
    }),
  }),
});

export const {
  useGetLessonQuestionsQuery,
  useGetCourseQuestionsQuery,
  useAskQuestionMutation,
  useGetAdminQuestionsQuery,
  useAnswerQuestionMutation,
  useResolveQuestionMutation,
} = questionApi;
