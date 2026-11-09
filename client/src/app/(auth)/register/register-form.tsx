'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Mail, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/auth/password-input';
import { useAuth } from '@/hooks/useAuth';
import { useRegisterMutation } from '@/services/authApi';
import { getApiErrorCode, getApiErrorMessage } from '@/utils/api-error';

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80, 'Name is too long'),
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .max(72, 'Password is too long')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
    acceptTerms: z.boolean().refine((value) => value, 'Please accept the terms to continue'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [registerUser, { isLoading }] = useRegisterMutation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const [error, setError] = React.useState('');

  const nextParam = searchParams.get('next');
  const next =
    nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', acceptTerms: false },
  });

  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(next || (isAdmin ? '/admin' : '/dashboard'));
    }
  }, [authLoading, isAuthenticated, isAdmin, next, router]);

  const onSubmit = async (values: RegisterValues) => {
    setError('');
    try {
      const result = await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
      }).unwrap();

      sessionStorage.setItem('auth_pending_email', result.email);
      if (result.devOtp) sessionStorage.setItem('auth_dev_otp', result.devOtp);
      else sessionStorage.removeItem('auth_dev_otp');

      toast.success('Account created. Verify your email to continue.');
      const query = new URLSearchParams({ email: result.email });
      if (next) query.set('next', next);
      router.push(`/verify-otp?${query.toString()}`);
    } catch (submitError) {
      if (getApiErrorCode(submitError) === 'EMAIL_EXISTS_UNVERIFIED') {
        const query = new URLSearchParams({ email: values.email });
        if (next) query.set('next', next);
        toast.info('Your account already exists — verify your email to continue.');
        router.push(`/verify-otp?${query.toString()}`);
        return;
      }
      setError(getApiErrorMessage(submitError, 'We could not create your account.'));
    }
  };

  return (
    <div>
      <span className="eyebrow">Join Learnova</span>
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Create your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Start with a free account. No card required until you enroll in a paid course.
      </p>

      {error ? (
        <Alert variant="error" className="mt-5">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="name" className="field-label">
            Full name
          </label>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Ada Lovelace"
            icon={<UserRound className="h-4 w-4" />}
            invalid={Boolean(errors.name)}
            {...register('name')}
          />
          {errors.name ? <p className="field-error">{errors.name.message}</p> : null}
        </div>

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
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Create a strong password"
            invalid={Boolean(errors.password)}
            {...register('password')}
          />
          {errors.password ? (
            <p className="field-error">{errors.password.message}</p>
          ) : (
            <p className="field-hint">At least 8 characters, with uppercase, lowercase and a number.</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="field-label">
            Confirm password
          </label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Repeat your password"
            invalid={Boolean(errors.confirmPassword)}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword ? <p className="field-error">{errors.confirmPassword.message}</p> : null}
        </div>

        <div>
          <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
              {...register('acceptTerms')}
            />
            <span>
              I agree to the{' '}
              <Link href="/terms" className="font-semibold text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="font-semibold text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.acceptTerms ? <p className="field-error">{errors.acceptTerms.message}</p> : null}
        </div>

        <Button type="submit" size="lg" className="w-full" loading={isLoading}>
          {isLoading ? 'Creating account…' : 'Create account'}
          {!isLoading ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}
          className="font-semibold text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
