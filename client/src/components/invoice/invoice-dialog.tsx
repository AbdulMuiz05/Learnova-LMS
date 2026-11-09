'use client';

import * as React from 'react';
import { CheckCircle2, Clock3, CreditCard, Download, Printer, RefreshCcw } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetOrderByIdQuery } from '@/services/orderApi';
import type { Order, OrderStatus } from '@/types';
import { formatCurrency, formatDateTime, levelLabel } from '@/utils/format';

const statusVariant: Record<OrderStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  paid: 'success',
  pending: 'warning',
  failed: 'destructive',
  refunded: 'secondary',
};

export function InvoiceDialog({
  orderId,
  open,
  onClose,
}: {
  orderId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading, isError, refetch, isFetching } = useGetOrderByIdQuery(orderId ?? '', {
    skip: !open || !orderId,
  });
  const order = data?.order;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invoice"
      description={order?.invoiceNumber ? `Invoice ${order.invoiceNumber}` : 'Payment receipt'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => window.print()} disabled={!order}>
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </Button>
        </>
      }
    >
      {isLoading ? (
        <InvoiceSkeleton />
      ) : isError || !order ? (
        <div className="space-y-3">
          <Alert variant="error" title="Invoice unavailable">
            We could not load this order. It may belong to another account.
          </Alert>
          <Button variant="outline" onClick={() => refetch()} loading={isFetching}>
            <RefreshCcw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      ) : (
        <InvoiceBody order={order} />
      )}
    </Modal>
  );
}

function InvoiceBody({ order }: { order: Order }) {
  const discount = Math.max(0, (order.originalAmount ?? 0) - order.amount);
  const providerLabel =
    order.provider === 'stripe'
      ? 'Card payment (Stripe)'
      : order.provider === 'demo'
        ? 'Demo checkout (test mode)'
        : 'Free enrollment';

  return (
    <div className="print-area rounded-xl border bg-card p-5 text-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
        <div>
          <p className="text-xl font-black tracking-tight">
            Dev<span className="text-primary">Weekends</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Practical engineering education</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Invoice</p>
          <p className="mt-1 font-mono text-sm font-semibold">{order.invoiceNumber || 'Pending payment'}</p>
          <div className="mt-1.5 flex justify-end">
            <Badge variant={statusVariant[order.status]}>{order.status}</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 py-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Billed to</p>
          <p className="mt-2 font-semibold">{order.user?.name}</p>
          <p className="text-muted-foreground">{order.user?.email}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Issued</p>
          <p className="mt-2 font-medium">{formatDateTime(order.paidAt || order.createdAt)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Order reference: {order._id.slice(-8).toUpperCase()}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-left">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Description</th>
              <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-4 py-3.5">
                <p className="font-semibold">{order.course?.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {levelLabel(order.course?.level ?? 'beginner')} · lifetime access · certificate included
                </p>
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-right font-medium">
                {formatCurrency(order.originalAmount ?? order.amount, order.currency)}
              </td>
            </tr>
            {discount > 0 ? (
              <tr className="border-t text-success">
                <td className="px-4 py-2.5 text-sm">Discount applied</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right text-sm">
                  −{formatCurrency(discount, order.currency)}
                </td>
              </tr>
            ) : null}
          </tbody>
          <tfoot className="bg-muted/30">
            <tr className="border-t">
              <td className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Total {order.status === 'paid' ? 'paid' : 'due'}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-base font-black">
                {formatCurrency(order.amount, order.currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-2">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <CreditCard className="h-3.5 w-3.5" />
            Payment method
          </p>
          <p className="mt-1.5 flex items-center gap-1.5">
            {order.status === 'paid' ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <Clock3 className="h-4 w-4 text-amber-500" />
            )}
            {providerLabel}
          </p>
          {order.stripeSessionId ? (
            <p className="mt-1 break-all font-mono text-[10px] text-muted-foreground">
              {order.stripeSessionId}
            </p>
          ) : null}
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Support</p>
          <p className="mt-1.5 text-muted-foreground">support@learnova.local</p>
          <p className="text-xs text-muted-foreground">Keep this receipt for your records.</p>
        </div>
      </div>

      {order.status !== 'paid' ? (
        <Alert variant="warning" className="mt-5">
          This order is not finalized. Access is granted only after payment confirmation, and this
          document is not a valid receipt yet.
        </Alert>
      ) : null}

      {order.provider === 'demo' ? (
        <p className="mt-4 rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] leading-5 text-amber-700 dark:text-amber-300">
          Demo checkout: this payment was confirmed in a non-production environment and no real money
          moved.
        </p>
      ) : null}

      <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[10px] text-muted-foreground">
        <Download className="h-3 w-3" />
        Generated by Learnova — use Print / Save PDF to download.
      </p>
    </div>
  );
}

function InvoiceSkeleton() {
  return (
    <div className="space-y-4 rounded-xl border bg-card p-6">
      <div className="flex justify-between">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-10 w-28" />
      </div>
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-10 w-36" />
    </div>
  );
}
