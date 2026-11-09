'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, BadgeCheck, FlaskConical, ShieldAlert, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/spinner';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useConfirmDemoPaymentMutation } from '@/services/paymentApi';
import { useGetOrderByIdQuery } from '@/services/orderApi';
import { formatCurrency } from '@/utils/format';

export function CheckoutDemo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { ready } = useRequireAuth();
  const [confirmDemo, { isLoading: confirming }] = useConfirmDemoPaymentMutation();
  const [submitted, setSubmitted] = React.useState(false);

  const { data, isLoading, isError, refetch, isFetching } = useGetOrderByIdQuery(orderId ?? '', {
    skip: !ready || !orderId,
  });
  const order = data?.order;

  const handleConfirm = async () => {
    if (!order) return;
    try {
      setSubmitted(true);
      const result = await confirmDemo({
        orderId: order._id,
      }).unwrap();
      toast.success('Demo payment confirmed');
      router.replace(result.url || `/checkout/success?orderId=${order._id}&demo=1`);
    } catch (error) {
      setSubmitted(false);
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ??
          'Could not confirm the demo payment. Please try again.'
      );
    }
  };

  if (!orderId) {
    return (
      <div className="container-page py-20">
        <EmptyState
          icon={FlaskConical}
          title="No demo order found"
          description="This demo checkout link is missing an order ID. Start from a course page to create a demo order."
          action={
            <Link href="/courses" className={buttonVariants()}>
              Browse courses
            </Link>
          }
        />
      </div>
    );
  }

  if (!ready || isLoading) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center">
        <PageLoader label="Preparing demo checkout" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="container-page py-20">
        <EmptyState
          icon={ShieldAlert}
          title="We could not load this order"
          description="The order may belong to another account, or the API is unavailable."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button variant="outline" onClick={() => refetch()} loading={isFetching}>
                Retry
              </Button>
              <Link href="/dashboard/payments" className={buttonVariants({ variant: 'ghost' })}>
                Payments
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  if (order.status === 'paid') {
    return (
      <div className="container-page max-w-2xl py-16 sm:py-20">
        <div className="rounded-3xl border bg-card p-8 text-center shadow-soft">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
            <BadgeCheck className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-2xl font-bold">This order is already paid</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            No further action is needed and you will not be charged again.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              href={`/checkout/success?orderId=${order._id}`}
              className={buttonVariants()}
            >
              View confirmation
            </Link>
            <Link
              href={`/learn/${order.course?._id ?? ''}`}
              className={buttonVariants({ variant: 'outline' })}
            >
              Start learning
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (order.status !== 'pending') {
    return (
      <div className="container-page py-20">
        <EmptyState
          icon={ShieldAlert}
          title="This order can no longer be confirmed"
          description={`The order status is "${order.status}". Start a new checkout from the course page if you still want to enroll.`}
          action={
            <Link
              href={order.course?.slug ? `/courses/${order.course.slug}` : '/courses'}
              className={buttonVariants()}
            >
              Return to course
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page max-w-2xl py-14 sm:py-20">
      <div className="overflow-hidden rounded-3xl border bg-card shadow-lift">
        <div className="border-b bg-gradient-to-br from-amber-500/[0.1] via-background to-primary/[0.05] px-6 py-7 sm:px-9">
          <Badge variant="warning">
            <FlaskConical className="h-3.5 w-3.5" />
            Demo mode
          </Badge>
          <h1 className="mt-3 text-2xl font-black sm:text-3xl">Demo checkout</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Stripe keys are not configured on this environment, so the platform created a demo order
            instead of a real payment session. You must confirm explicitly below before access can be
            granted.
          </p>
        </div>

        <div className="p-6 sm:p-9">
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border bg-muted/20 p-4">
            {order.course?.thumbnail?.url ? (
              <span className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-muted">
                <Image
                  src={order.course.thumbnail.url}
                  alt={order.course.title}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-base font-bold">{order.course?.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {order.course?.level} · Order {order._id.slice(-8).toUpperCase()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black">{formatCurrency(order.amount, order.currency)}</p>
              <p className="text-[11px] text-muted-foreground">Demo amount</p>
            </div>
          </div>

          <Alert variant="warning" title="No real money is charged" className="mt-4">
            This flow only mimics a successful provider confirmation. In production, enrollment is
            granted exclusively by a verified Stripe webhook. Configure Stripe keys to use real
            checkout.
          </Alert>

          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Confirming creates a paid order, an invoice number and an enrollment in one server step.
            </li>
            <li className="flex gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Orders can only be confirmed by their owner. Confirming twice will not duplicate the
              enrollment.
            </li>
          </ul>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              size="lg"
              onClick={handleConfirm}
              loading={confirming || submitted}
              disabled={confirming || submitted}
            >
              Confirm demo payment
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Link
              href={order.course?.slug ? `/courses/${order.course.slug}` : '/courses'}
              className={buttonVariants({ variant: 'outline', size: 'lg' })}
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
