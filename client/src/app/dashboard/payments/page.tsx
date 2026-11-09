'use client';

import * as React from 'react';
import Link from 'next/link';
import { CreditCard, Download, ReceiptText, RefreshCcw, Wallet } from 'lucide-react';
import { InvoiceDialog } from '@/components/invoice/invoice-dialog';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useGetMyOrdersQuery, useGetOrderTotalsQuery } from '@/services/orderApi';
import type { OrderStatus } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

const statusVariant: Record<OrderStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  paid: 'success',
  pending: 'warning',
  failed: 'destructive',
  refunded: 'secondary',
};

const providerLabel: Record<string, string> = {
  stripe: 'Stripe card',
  demo: 'Demo checkout',
  free: 'Free enrollment',
};

export default function PaymentsPage() {
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState('all');
  const [invoiceId, setInvoiceId] = React.useState<string | null>(null);

  const { data: totals } = useGetOrderTotalsQuery();
  const { data, isLoading, isError, refetch, isFetching } = useGetMyOrdersQuery({
    page,
    limit: 10,
    status: status === 'all' ? undefined : status,
  });

  const orders = data?.items ?? [];

  const changeStatus = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow">
          <CreditCard className="h-3.5 w-3.5 text-primary" />
          Billing
        </span>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Payments &amp; invoices</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review every checkout, download receipts and confirm which payments granted course access.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Total invested
            </p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wallet className="h-[18px] w-[18px]" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-black">{formatCurrency(totals?.totalSpent ?? 0)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Sum of all successfully paid orders</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Paid orders
            </p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10 text-success">
              <ReceiptText className="h-[18px] w-[18px]" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-black">{totals?.paidOrders ?? 0}</p>
          <p className="mt-1 text-xs text-muted-foreground">Includes Stripe and confirmed demo payments</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Order history</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="order-status" className="sr-only">
            Filter by status
          </label>
          <Select
            id="order-status"
            value={status}
            onChange={(event) => changeStatus(event.target.value)}
            className="h-9 w-40 text-xs"
          >
            <option value="all">All statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()} loading={isFetching}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : isError ? (
        <EmptyState
          icon={RefreshCcw}
          title="Could not load payments"
          description="The orders API did not respond. Confirm the backend is running and retry."
          action={
            <Button onClick={() => refetch()} loading={isFetching}>
              Retry
            </Button>
          }
        />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title={status === 'all' ? 'No payments yet' : 'No orders with this status'}
          description={
            status === 'all'
              ? 'Paid checkouts and free enrollments will be listed here with downloadable receipts.'
              : 'Try another status filter to see your other orders.'
          }
          action={
            <Link href="/courses" className={buttonVariants({ variant: 'outline' })}>
              Browse courses
            </Link>
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Date</th>
                    <th>Provider</th>
                    <th>Status</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <div className="min-w-48">
                          <p className="font-medium">{order.course?.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Ref {order._id.slice(-8).toUpperCase()}
                          </p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap text-muted-foreground">{formatDate(order.createdAt)}</td>
                      <td className="whitespace-nowrap text-xs text-muted-foreground">
                        {providerLabel[order.provider] ?? order.provider}
                      </td>
                      <td>
                        <Badge variant={statusVariant[order.status]}>{order.status}</Badge>
                      </td>
                      <td className="whitespace-nowrap text-right font-semibold">
                        {formatCurrency(order.amount, order.currency)}
                      </td>
                      <td className="text-right">
                        {order.status === 'paid' ? (
                          <Button size="sm" variant="outline" onClick={() => setInvoiceId(order._id)}>
                            <Download className="h-3.5 w-3.5" />
                            Receipt
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not issued</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {data && data.meta.totalPages > 1 ? (
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPageChange={setPage} />
          ) : null}
        </>
      )}

      <p className="flex items-center gap-2 rounded-xl border bg-muted/30 p-4 text-xs leading-5 text-muted-foreground">
        <CreditCard className="h-4 w-4 shrink-0 text-primary" />
        Enrollment is granted only after the payment provider confirms the charge. Cards are processed
        by Stripe; no card details are stored by this platform.
      </p>

      <InvoiceDialog open={Boolean(invoiceId)} orderId={invoiceId} onClose={() => setInvoiceId(null)} />
    </div>
  );
}
