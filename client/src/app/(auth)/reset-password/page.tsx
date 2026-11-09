import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ResetPasswordForm } from './reset-password-form';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Choose a new password',
  description: 'Use the reset code from your email to set a new password.',
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-5">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
