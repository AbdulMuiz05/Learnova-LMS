'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Download,
  ReceiptText,
  RefreshCcw,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { InvoiceDialog } from '@/components/invoice/invoice-dialog';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAdminOrdersQuery, useLazyExportOrdersCsvQuery } from '@/services/orderApi';
import type { OrderStatus } from '@/types';
import { formatCurrency, formatDateTime, formatNumber } from '@/utils/format';

const statusVariant: Record<OrderStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  paid: 'success',
  pending: 'warning',
  failed: 'destructive',
  refunded: 'secondary',
};

export default function AdminOrdersPage() {
  const [search, setSearch] = React.useState('');
  const deferredSearch = React.useDeferredValue(search);
  const [status, setStatus] = React.useState('');
  const [provider, setProvider] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [invoiceId, setInvoiceId] = React.useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useGetAdminOrdersQuery({
    page,
    limit: 20,
    search: deferredSearch || undefined,
    status: status || undefined,
    provider: provider || undefined,
  });
  const [exportCsv, { isFetching: exporting }] = useLazyExportOrdersCsvQuery();

  React.useEffect(() => {
    setPage(1);
  }, [deferredSearch, status, provider]);

  const orders = data?.items ?? [];
  const meta = data?.meta;

  const downloadCsv = async () => {
    try {
      const csv = await exportCsv({
        status: status || undefined,
        provider: provider || undefined,
      }).unwrap();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `learnova-orders-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success('Orders exported');
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ?? 'Could not export orders'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">
            <CreditCard className="h-3.5 w-3.5 text-primary" />
            Sales
          </span>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every checkout attempt with provider, status and invoice reference. Export the filtered view
            to CSV.
          </p>
        </div>
        <Button variant="outline" onClick={downloadCsv} loading={exporting}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by customer, email or invoice…"
          icon={<Search className="h-4 w-4" />}
          className="sm:max-w-sm"
          aria-label="Search orders"
        />
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter by status"
          className="sm:w-40"
        >
          <option value="">All statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </Select>
        <Select
          value={provider}
          onChange={(event) => setProvider(event.target.value)}
          aria-label="Filter by provider"
          className="sm:w-40"
        >
          <option value="">All providers</option>
          <option value="stripe">Stripe</option>
          <option value="demo">Demo</option>
          <option value="free">Free</option>
        </Select>
        {meta ? (
          <span className="text-xs text-muted-foreground sm:ml-auto">
            {formatNumber(meta.total)} order{meta.total === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={RefreshCcw}
          title="Orders could not load"
          description="The payments service did not respond."
          action={
            <Button onClick={() => refetch()} loading={isFetching}>
              <RefreshCcw className="h-4 w-4" />
              Retry
            </Button>
          }
        />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No orders found"
          description="Orders appear here as students check out. Adjust filters to see older records."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Course</th>
                  <th className="px-4 py-3 font-semibold">Invoice</th>
                  <th className="px-4 py-3 font-semibold">Provider</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 text-right font-semibold">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order._id} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={order.user?.name} src={order.user?.avatar?.url} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{order.user?.name ?? 'Student'}</p>
                          <p className="truncate text-xs text-muted-foreground">{order.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="line-clamp-1 max-w-[220px] text-muted-foreground">
                        {order.course?.title}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {order.invoiceNumber || '—'}
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{order.provider}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums">
                      {formatCurrency(order.amount, order.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[order.status]} className="capitalize">
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setInvoiceId(order._id)}
                        aria-label="View invoice"
                        title="View invoice"
                      >
                        <ReceiptText className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 text-xs text-muted-foreground">
              <span>
                Showing {orders.length} of {formatNumber(meta.total)} orders
              </span>
              <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
            </div>
          ) : null}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Need a student-level view? Open{' '}
        <Link href="/admin/students" className="font-semibold text-primary hover:underline">
          Students
        </Link>{' '}
        to inspect their enrollment and payment history.
      </p>

      <InvoiceDialog
        open={Boolean(invoiceId)}
        orderId={invoiceId ?? ''}
        onClose={() => setInvoiceId(null)}
      />
    </div>
  );
}
