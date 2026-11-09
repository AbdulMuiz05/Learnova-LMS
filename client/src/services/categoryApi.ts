import { baseApi } from '@/services/baseApi';
import type { ApiResponse, Category } from '@/types';

export interface CategoryPayload {
  name?: string;
  description?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}

export const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<{ categories: Category[] }, void>({
      query: () => '/categories',
      transformResponse: (response: ApiResponse<{ categories: Category[] }>) => response.data,
      providesTags: ['Category'],
    }),
    getAdminCategories: builder.query<{ categories: Category[] }, void>({
      query: () => '/categories/admin/all',
      transformResponse: (response: ApiResponse<{ categories: Category[] }>) => response.data,
      providesTags: ['Category'],
    }),
    createCategory: builder.mutation<{ category: Category }, CategoryPayload>({
      query: (body) => ({ url: '/categories', method: 'POST', body }),
      transformResponse: (response: ApiResponse<{ category: Category }>) => response.data,
      invalidatesTags: ['Category', 'Course', 'Homepage'],
    }),
    updateCategory: builder.mutation<{ category: Category }, { id: string; body: CategoryPayload }>({
      query: ({ id, body }) => ({ url: `/categories/${id}`, method: 'PATCH', body }),
      transformResponse: (response: ApiResponse<{ category: Category }>) => response.data,
      invalidatesTags: ['Category', 'Course', 'CourseDetail'],
    }),
    deleteCategory: builder.mutation<null, string>({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      transformResponse: (response: ApiResponse<null>) => response.data,
      invalidatesTags: ['Category', 'Course', 'Homepage'],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetAdminCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;
