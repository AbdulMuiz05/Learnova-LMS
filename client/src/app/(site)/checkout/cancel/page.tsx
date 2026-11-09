import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CheckoutCancel } from './checkout-cancel';
import { PageLoader } from '@/components/ui/spinner';

export const metadata: Metadata = {
  title: 'Checkout cancelled',
  description: 'Your checkout was cancelled. No course access was granted.',
};

export default function CheckoutCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page flex min-h-[60vh] items-center justify-center">
          <PageLoader label="Loading checkout" />
        </div>
      }
    >
      <CheckoutCancel />
    </Suspense>
  );
}
