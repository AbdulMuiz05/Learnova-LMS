import { Suspense } from 'react';
import type { Metadata } from 'next';
import { RegisterForm } from './register-form';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Create account',
  description: 'Create your free Learnova learning account.',
};

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-5">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
