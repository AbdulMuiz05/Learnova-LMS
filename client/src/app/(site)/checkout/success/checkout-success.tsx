'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { InvoiceDialog } from '@/components/invoice/invoice-dialog';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/spinner';
import { useGetOrderByIdQuery } from '@/services/orderApi';
import { formatCurrency } from '@/utils/format';

export function CheckoutSuccess() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const demo = searchParams.get('demo') === '1';
  const [invoiceOpen, setInvoiceOpen] = React.useState(false);
  const [waited, setWaited] = React.useState(0);

  const { data, isLoading, isError, refetch, isFetching } = useGetOrderByIdQuery(orderId ?? '', {
    skip: !orderId,
  });
  const order = data?.order;
  const pending = order?.status === 'pending';

  React.useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => setWaited((value) => value + 1), 1000);
    return () => window.clearTimeout(timer);
  }, [pending, waited]);

  React.useEffect(() => {
    if (!pending) return;
    const interval = window.setInterval(() => refetch(), 2500);
    return () => window.clearInterval(interval);
  }, [pending, refetch]);

  if (!orderId) {
    return (
      <div className="container-page py-20">
        <EmptyState
          icon={ReceiptText}
          title="No order reference found"
          description="This confirmation link is missing an order ID. Check your payments page to review your orders."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link href="/dashboard/payments" className={buttonVariants()}>
                View payments
              </Link>
              <Link href="/courses" className={buttonVariants({ variant: 'outline' })}>
                Browse courses
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center">
        <PageLoader label="Confirming your payment" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="container-page py-20">
        <EmptyState
          icon={RefreshCcw}
          title="We could not load this order"
          description="The order may belong to another account, or the API is unavailable. Check your payments page."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button onClick={() => refetch()} loading={isFetching}>
                Retry
              </Button>
              <Link href="/dashboard/payments" className={buttonVariants({ variant: 'outline' })}>
                Payments
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  if (order.status === 'failed') {
    return (
      <div className="container-page py-20">
        <EmptyState
          icon={XCircle}
          title="Payment failed"
          description="No access was granted for this order. Return to the course to try checkout again."
          action={
            <Link href={`/courses/${order.course?.slug ?? ''}`} className={buttonVariants()}>
              Return to course
            </Link>
          }
        />
      </div>
    );
  }

  if (order.status !== 'paid') {
    return (
      <div className="container-page max-w-2xl py-16">
        <div className="rounded-3xl border bg-card p-6 text-center shadow-soft sm:p-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock3 className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-2xl font-bold">Confirming your payment</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            We are waiting for the payment provider to confirm your order. Course access is granted only
            after that confirmation arrives. This page refreshes automatically.
          </p>

          <div className="mt-6 rounded-2xl border bg-muted/30 p-4 text-left">
            <div className="flex items-center gap-3">
              {order.course?.thumbnail?.url ? (
                <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image src={order.course.thumbnail.url} alt={order.course.title} fill sizes="80px" className="object-cover" />
                </span>
              ) : null}
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-semibold">{order.course?.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatCurrency(order.amount, order.currency)} · {order.provider}
                </p>
              </div>
              <Badge variant="warning" className="ml-auto shrink-0">
                <Loader2 className="h-3 w-3 animate-spin" />
                Pending
              </Badge>
            </div>
          </div>

          <Alert variant="info" className="mt-5 text-left">
            {waited > 20
              ? 'The provider has not confirmed yet. Payments can take a minute. You can safely leave this page and check your payments page later.'
              : 'This usually takes a few seconds. Keep this tab open while the webhook is processed.'}
          </Alert>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Button onClick={() => refetch()} loading={isFetching}>
              <RefreshCcw className="h-4 w-4" />
              Check again
            </Button>
            <Link href="/dashboard/payments" className={buttonVariants({ variant: 'outline' })}>
              View payments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page max-w-3xl py-14 sm:py-20">
      <div className="overflow-hidden rounded-3xl border bg-card shadow-lift">
        <div className="relative overflow-hidden border-b bg-gradient-to-br from-success/[0.12] via-background to-primary/[0.06] px-6 py-8 text-center sm:px-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h1 className="mt-5 text-2xl font-black sm:text-3xl">You are enrolled</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Your payment was verified by our server and course access is now active. Start with the first
            lesson or pick up where you left off.
          </p>
          {demo || order.provider === 'demo' ? (
            <Badge variant="warning" className="mt-3">
              Demo checkout — no real money was charged
            </Badge>
          ) : null}
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border bg-muted/20 p-4">
            {order.course?.thumbnail?.url ? (
              <span className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-muted">
                <Image src={order.course.thumbnail.url} alt={order.course.title} fill sizes="128px" className="object-cover" />
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Course unlocked</p>
              <p className="mt-1 line-clamp-2 text-base font-bold">{order.course?.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Paid {formatCurrency(order.amount, order.currency)} · {order.provider === 'stripe' ? 'Stripe' : order.provider === 'demo' ? 'Demo checkout' : 'Free'}
              </p>
            </div>
          </div>

          <dl className="mt-5 grid gap-3 rounded-2xl border p-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Invoice</dt>
              <dd className="mt-0.5 font-semibold">{order.invoiceNumber || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Order reference</dt>
              <dd className="mt-0.5 font-mono text-xs font-semibold">{order._id.slice(-8).toUpperCase()}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd className="mt-0.5">
                <Badge variant="success">Paid</Badge>
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={`/learn/${order.course?._id ?? ''}`} className={buttonVariants({ size: 'lg' })}>
              Start learning
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Button size="lg" variant="outline" onClick={() => setInvoiceOpen(true)}>
              <ReceiptText className="h-4 w-4" />
              View invoice
            </Button>
            <Link href="/dashboard/courses" className={buttonVariants({ variant: 'ghost', size: 'lg' })}>
              My courses
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 border-t pt-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              Webhook-verified payment
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              Receipt available in payments
            </span>
          </div>
        </div>
      </div>

      <InvoiceDialog open={invoiceOpen} orderId={order._id} onClose={() => setInvoiceOpen(false)} />
    </div>
  );
}
