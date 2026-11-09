import { baseApi } from '@/services/baseApi';
import type {
  AdminSiteContent,
  ApiResponse,
  Faq,
  HomepageContent,
  HomepageData,
  SiteSettings,
} from '@/types';

export interface HomepagePayload {
  hero?: Partial<HomepageContent['hero']>;
  featuredCourses?: string[];
  benefits?: HomepageContent['benefits'];
}

export interface FaqPayload {
  question?: string;
  answer?: string;
  order?: number;
  isActive?: boolean;
}

export const siteApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHomepage: builder.query<HomepageData, void>({
      query: () => '/homepage',
      transformResponse: (response: ApiResponse<HomepageData>) => response.data,
      providesTags: ['Homepage'],
    }),
    getPublicFaqs: builder.query<{ faqs: Faq[] }, void>({
      query: () => '/faqs',
      transformResponse: (response: ApiResponse<{ faqs: Faq[] }>) => response.data,
      providesTags: ['Faq'],
    }),
    getPublicSettings: builder.query<SiteSettings, void>({
      query: () => '/settings',
      transformResponse: (response: ApiResponse<SiteSettings>) => response.data,
      providesTags: ['SiteSettings'],
    }),
    getAdminSiteContent: builder.query<AdminSiteContent, void>({
      query: () => '/admin/site-content',
      transformResponse: (response: ApiResponse<AdminSiteContent>) => response.data,
      providesTags: ['Homepage', 'SiteSettings', 'Faq'],
    }),
    updateHomepage: builder.mutation<{ homepage: HomepageContent }, HomepagePayload>({
      query: (body) => ({ url: '/homepage', method: 'PATCH', body }),
      transformResponse: (response: ApiResponse<{ homepage: HomepageContent }>) => response.data,
      invalidatesTags: ['Homepage', 'Faq'],
    }),
    getAllFaqs: builder.query<{ faqs: Faq[] }, void>({
      query: () => '/admin/faqs',
      transformResponse: (response: ApiResponse<{ faqs: Faq[] }>) => response.data,
      providesTags: ['Faq'],
    }),
    createFaq: builder.mutation<{ faq: Faq }, FaqPayload>({
      query: (body) => ({ url: '/admin/faqs', method: 'POST', body }),
      transformResponse: (response: ApiResponse<{ faq: Faq }>) => response.data,
      invalidatesTags: ['Faq', 'Homepage'],
    }),
    updateFaq: builder.mutation<{ faq: Faq }, { id: string; body: FaqPayload }>({
      query: ({ id, body }) => ({ url: `/admin/faqs/${id}`, method: 'PATCH', body }),
      transformResponse: (response: ApiResponse<{ faq: Faq }>) => response.data,
      invalidatesTags: ['Faq', 'Homepage'],
    }),
    deleteFaq: builder.mutation<null, string>({
      query: (id) => ({ url: `/admin/faqs/${id}`, method: 'DELETE' }),
      transformResponse: (response: ApiResponse<null>) => response.data,
      invalidatesTags: ['Faq', 'Homepage'],
    }),
    updateSettings: builder.mutation<{ settings: SiteSettings }, Partial<SiteSettings>>({
      query: (body) => ({ url: '/admin/settings', method: 'PATCH', body }),
      transformResponse: (response: ApiResponse<{ settings: SiteSettings }>) => response.data,
      invalidatesTags: ['SiteSettings', 'Homepage'],
    }),
  }),
});

export const {
  useGetHomepageQuery,
  useGetPublicFaqsQuery,
  useGetPublicSettingsQuery,
  useGetAdminSiteContentQuery,
  useUpdateHomepageMutation,
  useGetAllFaqsQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
  useUpdateSettingsMutation,
} = siteApi;
