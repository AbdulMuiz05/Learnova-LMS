import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CheckoutSuccess } from './checkout-success';
import { PageLoader } from '@/components/ui/spinner';

export const metadata: Metadata = {
  title: 'Payment confirmation',
  description: 'Confirming your enrollment after payment.',
};

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page flex min-h-[60vh] items-center justify-center">
          <PageLoader label="Confirming your payment" />
        </div>
      }
    >
      <CheckoutSuccess />
    </Suspense>
  );
}
