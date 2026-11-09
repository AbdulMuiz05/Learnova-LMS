'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, CreditCard, ReceiptText, ShieldCheck, XCircle } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/spinner';
import { useGetOrderByIdQuery } from '@/services/orderApi';
import { formatCurrency } from '@/utils/format';

export function CheckoutCancel() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const { data, isLoading, isError, refetch, isFetching } = useGetOrderByIdQuery(orderId ?? '', {
    skip: !orderId,
  });
  const order = data?.order;
  const courseHref = order?.course?.slug ? `/courses/${order.course.slug}` : '/courses';

  return (
    <div className="container-page max-w-2xl py-16 sm:py-20">
      <div className="overflow-hidden rounded-3xl border bg-card shadow-soft">
        <div className="border-b bg-gradient-to-br from-destructive/[0.06] via-background to-amber-500/[0.06] px-6 py-8 text-center sm:px-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <XCircle className="h-8 w-8" />
          </span>
          <h1 className="mt-5 text-2xl font-black sm:text-3xl">Checkout cancelled</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            You left the payment page before completing the purchase. You have not been enrolled in this
            course from this attempt.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {!orderId ? (
            <Alert variant="info">
              This return link did not include an order reference. If you are unsure about a payment,
              review your payments page before trying again.
            </Alert>
          ) : isLoading ? (
            <div className="flex justify-center py-6">
              <PageLoader label="Looking up your order" />
            </div>
          ) : isError || !order ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                We could not load the order details. You can still review your payments or return to the
                course catalog.
              </p>
              <Button className="mt-4" variant="outline" onClick={() => refetch()} loading={isFetching}>
                Retry
              </Button>
            </div>
          ) : (
            <>
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Course
                  </p>
                  <p className="mt-1 line-clamp-2 text-base font-bold">{order.course?.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatCurrency(order.amount, order.currency)} · Order {order._id.slice(-8).toUpperCase()}
                  </p>
                </div>
              </div>

              <Alert variant="warning" className="mt-4">
                <p className="font-semibold">No access was granted from this checkout</p>
                <p className="mt-1">
                  Course access is only activated after the payment provider confirms an order on our
                  server. If a payment did go through, it will appear in your payments page once
                  verified — do not pay twice.
                </p>
              </Alert>
            </>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={courseHref} className={buttonVariants()}>
              <ArrowLeft className="h-4 w-4" />
              Back to course
            </Link>
            <Link href="/dashboard/payments" className={buttonVariants({ variant: 'outline' })}>
              <ReceiptText className="h-4 w-4" />
              View payments
            </Link>
            <Link href="/courses" className={buttonVariants({ variant: 'ghost' })}>
              Browse courses
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 border-t pt-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              Secure checkout
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              No card details are stored by us
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
