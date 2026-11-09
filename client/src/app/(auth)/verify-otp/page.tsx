import { Suspense } from 'react';
import type { Metadata } from 'next';
import { VerifyOtpForm } from './verify-otp-form';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Verify your email',
  description: 'Enter the six-digit verification code sent to your email.',
};

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-5">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      }
    >
      <VerifyOtpForm />
    </Suspense>
  );
}
