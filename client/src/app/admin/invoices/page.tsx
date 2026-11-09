'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Download,
  FileText,
  Printer,
  ReceiptText,
  RefreshCcw,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { InvoiceDialog } from '@/components/invoice/invoice-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAdminOrdersQuery, useLazyExportOrdersCsvQuery } from '@/services/orderApi';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';

export default function AdminInvoicesPage() {
  const [search, setSearch] = React.useState('');
  const deferredSearch = React.useDeferredValue(search);
  const [page, setPage] = React.useState(1);
  const [invoiceId, setInvoiceId] = React.useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useGetAdminOrdersQuery({
    page,
    limit: 20,
    status: 'paid',
    search: deferredSearch || undefined,
  });
  const [exportCsv, { isFetching: exporting }] = useLazyExportOrdersCsvQuery();

  React.useEffect(() => {
    setPage(1);
  }, [deferredSearch]);

  const orders = data?.items ?? [];
  const meta = data?.meta;
  const pageTotal = orders.reduce((total, order) => total + order.amount, 0);

  const exportInvoices = async () => {
    try {
      const csv = await exportCsv({ status: 'paid' }).unwrap();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `learnova-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success('Invoice data exported');
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ?? 'Could not export invoices'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">
            <FileText className="h-3.5 w-3.5 text-primary" />
            Billing
          </span>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Invoices</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Paid orders receive sequential invoice numbers. Open any invoice to print or save it as a PDF.
          </p>
        </div>
        <Button variant="outline" onClick={exportInvoices} loading={exporting}>
          <Download className="h-4 w-4" />
          Export paid orders
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search invoice number, customer or email…"
          icon={<Search className="h-4 w-4" />}
          className="sm:max-w-sm"
          aria-label="Search invoices"
        />
        {meta ? (
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground sm:ml-auto">
            <span>{formatNumber(meta.total)} paid invoices</span>
            <span className="hidden sm:inline">·</span>
            <span>
              Page value <strong className="text-foreground">{formatCurrency(pageTotal)}</strong>
            </span>
          </div>
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
          title="Invoices could not load"
          description="The billing service did not respond."
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
          title="No paid invoices yet"
          description="When an order is confirmed by Stripe or a demo payment, its invoice appears here automatically."
          action={
            <Link
              href="/admin/orders"
              className="inline-flex h-10 items-center rounded-lg border px-4 text-sm font-semibold"
            >
              View all orders
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Invoice</th>
                  <th className="px-4 py-3 font-semibold">Billed to</th>
                  <th className="px-4 py-3 font-semibold">Course</th>
                  <th className="px-4 py-3 font-semibold">Paid on</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Provider</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order._id} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3 font-mono text-xs font-semibold">
                      {order.invoiceNumber || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{order.user?.name ?? 'Student'}</p>
                      <p className="text-xs text-muted-foreground">{order.user?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="line-clamp-1 max-w-[240px] text-muted-foreground">
                        {order.course?.title}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(order.paidAt ?? order.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums">
                      {formatCurrency(order.amount, order.currency)}
                      {order.originalAmount > order.amount ? (
                        <p className="text-[10px] font-normal text-muted-foreground line-through">
                          {formatCurrency(order.originalAmount, order.currency)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={order.provider === 'stripe' ? 'default' : 'secondary'} className="capitalize">
                        {order.provider}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInvoiceId(order._id)}
                        >
                          <Printer className="h-3.5 w-3.5" />
                          View / print
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 text-xs text-muted-foreground">
              <span>
                Showing {orders.length} of {formatNumber(meta.total)} invoices
              </span>
              <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
            </div>
          ) : null}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Invoices are generated by the server only after a verified payment, so pending or failed orders
        never carry an invoice number.
      </p>

      <InvoiceDialog
        open={Boolean(invoiceId)}
        orderId={invoiceId ?? ''}
        onClose={() => setInvoiceId(null)}
      />
    </div>
  );
}
