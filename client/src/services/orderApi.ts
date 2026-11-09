import { baseApi } from '@/services/baseApi';
import type { ApiResponse, Order, OrderTotals, Paginated } from '@/types';

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  provider?: string;
  search?: string;
}

export const orderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyOrders: builder.query<Paginated<Order>, OrderQueryParams | void>({
      query: (params) => ({ url: '/orders/my', params: params || {} }),
      transformResponse: (response: ApiResponse<Paginated<Order>>) => response.data,
      providesTags: ['Order'],
    }),
    getOrderById: builder.query<{ order: Order }, string>({
      query: (orderId) => `/orders/${orderId}`,
      transformResponse: (response: ApiResponse<{ order: Order }>) => response.data,
      providesTags: (_result, _error, id) => [{ type: 'Order', id }],
    }),
    getOrderTotals: builder.query<OrderTotals, void>({
      query: () => '/orders/totals',
      transformResponse: (response: ApiResponse<OrderTotals>) => response.data,
      providesTags: ['Order'],
    }),
    getAdminOrders: builder.query<Paginated<Order>, OrderQueryParams | void>({
      query: (params) => ({ url: '/orders/admin/all', params: params || {} }),
      transformResponse: (response: ApiResponse<Paginated<Order>>) => response.data,
      providesTags: ['Order'],
    }),
    exportOrdersCsv: builder.query<string, { status?: string; provider?: string } | void>({
      query: (params) => ({
        url: '/orders/admin/export',
        params: params || {},
        responseHandler: (response: Response) => response.text(),
      }),
    }),
  }),
});

export const {
  useGetMyOrdersQuery,
  useGetOrderByIdQuery,
  useGetOrderTotalsQuery,
  useGetAdminOrdersQuery,
  useLazyExportOrdersCsvQuery,
} = orderApi;
