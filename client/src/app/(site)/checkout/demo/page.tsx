import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CheckoutDemo } from './checkout-demo';
import { PageLoader } from '@/components/ui/spinner';

export const metadata: Metadata = {
  title: 'Demo checkout',
  description: 'Complete a demo checkout when payment credentials are not configured.',
};

export default function CheckoutDemoPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page flex min-h-[60vh] items-center justify-center">
          <PageLoader label="Loading demo checkout" />
        </div>
      }
    >
      <CheckoutDemo />
    </Suspense>
  );
}
