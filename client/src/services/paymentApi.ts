import { baseApi } from '@/services/baseApi';
import type { ApiResponse, CheckoutResponse, Order, PaymentConfig } from '@/types';

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentConfig: builder.query<PaymentConfig, void>({
      query: () => '/payments/config',
      transformResponse: (response: ApiResponse<PaymentConfig>) => response.data,
    }),
    createCheckout: builder.mutation<CheckoutResponse, { courseId: string }>({
      query: (body) => ({ url: '/payments/checkout', method: 'POST', body }),
      transformResponse: (response: ApiResponse<CheckoutResponse>) => response.data,
      invalidatesTags: ['Order', 'CourseDetail', 'Enrollment', 'AdminStats', 'AdminAnalytics'],
    }),
    confirmDemoPayment: builder.mutation<{ order: Order; url: string }, { orderId: string }>({
      query: (body) => ({ url: '/payments/demo/confirm', method: 'POST', body }),
      transformResponse: (response: ApiResponse<{ order: Order; url: string }>) => response.data,
      invalidatesTags: [
        'Order',
        'Enrollment',
        'Course',
        'CourseDetail',
        'AdminStats',
        'AdminAnalytics',
      ],
    }),
  }),
});

export const {
  useGetPaymentConfigQuery,
  useCreateCheckoutMutation,
  useConfirmDemoPaymentMutation,
} = paymentApi;
