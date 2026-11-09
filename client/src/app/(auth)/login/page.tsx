import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginForm } from './login-form';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your Learnova learning account.',
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-5">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
