'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/auth/password-input';
import { useAuth } from '@/hooks/useAuth';
import { useLoginMutation } from '@/services/authApi';
import { baseApi } from '@/services/baseApi';
import { setCredentials } from '@/features/auth/authSlice';
import { useAppDispatch } from '@/store/hooks';
import { getApiErrorCode, getApiErrorMessage } from '@/utils/api-error';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

function safeNext(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/login')) return null;
  return value;
}

export function LoginForm() {
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get('next'));
  const justReset = searchParams.get('reset') === '1';
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const [error, setError] = React.useState('');
  const [unverifiedEmail, setUnverifiedEmail] = React.useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(next || (isAdmin ? '/admin' : '/dashboard'));
    }
  }, [authLoading, isAuthenticated, isAdmin, next, router]);

  const onSubmit = async (values: LoginValues) => {
    setError('');
    setUnverifiedEmail('');
    try {
      const result = await login(values).unwrap();
      dispatch(setCredentials(result.user));
      dispatch(baseApi.util.resetApiState());
      toast.success(`Welcome back, ${result.user.name.split(' ')[0]}`);
      router.replace(next || (result.user.role === 'admin' ? '/admin' : '/dashboard'));
    } catch (submitError) {
      if (getApiErrorCode(submitError) === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(values.email);
        setError('Please verify your email address before signing in.');
        return;
      }
      setError(getApiErrorMessage(submitError, 'Unable to sign in.'));
    }
  };

  const fillDemo = (email: string, password: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
  };

  return (
    <div>
      <span className="eyebrow">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        Secure sign in
      </span>
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in to continue learning, track progress, and pick up where you left off.
      </p>

      {justReset ? (
        <Alert variant="success" className="mt-5" title="Password updated">
          Sign in with your new password to continue.
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="error" className="mt-5">
          {error}
          {unverifiedEmail ? (
            <Link
              href={`/verify-otp?email=${encodeURIComponent(unverifiedEmail)}`}
              className="mt-1 block font-semibold underline"
            >
              Verify this email now
            </Link>
          ) : null}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="field-label">
            Email address
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            icon={<Mail className="h-4 w-4" />}
            invalid={Boolean(errors.email)}
            {...register('email')}
          />
          {errors.email ? <p className="field-error">{errors.email.message}</p> : null}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="field-label">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Your password"
            invalid={Boolean(errors.password)}
            {...register('password')}
          />
          {errors.password ? <p className="field-error">{errors.password.message}</p> : null}
        </div>

        <Button type="submit" size="lg" className="w-full" loading={isLoading}>
          {isLoading ? 'Signing in…' : 'Sign in'}
          {!isLoading ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Learnova?{' '}
        <Link href={next ? `/register?next=${encodeURIComponent(next)}` : '/register'} className="font-semibold text-primary hover:underline">
          Create a free account
        </Link>
      </p>

      {process.env.NODE_ENV !== 'production' ? (
        <details className="mt-8 rounded-xl border bg-muted/30 p-4 text-xs">
          <summary className="cursor-pointer font-semibold text-muted-foreground">Demo accounts (seeded)</summary>
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[11px]">admin@learnova.local · Admin@12345</span>
              <button
                type="button"
                onClick={() => fillDemo('admin@learnova.local', 'Admin@12345')}
                className="font-semibold text-primary hover:underline"
              >
                Use admin
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[11px]">aisha@student.learnova.local · Student@12345</span>
              <button
                type="button"
                onClick={() => fillDemo('aisha@student.learnova.local', 'Student@12345')}
                className="font-semibold text-primary hover:underline"
              >
                Use student
              </button>
            </div>
          </div>
        </details>
      ) : null}
    </div>
  );
}
