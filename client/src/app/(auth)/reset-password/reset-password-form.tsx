'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Copy, LockKeyhole, Mail, RefreshCcw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { OtpInput } from '@/components/auth/otp-input';
import { PasswordInput } from '@/components/auth/password-input';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useResendOtpMutation, useResetPasswordMutation } from '@/services/authApi';
import { getApiErrorMessage } from '@/utils/api-error';

const schema = z
  .object({
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
    code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .max(72, 'Password is too long')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type Values = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [resendOtp, { isLoading: resending }] = useResendOtpMutation();
  const [error, setError] = React.useState('');
  const [devOtp, setDevOtp] = React.useState<string | null>(null);
  const [cooldown, setCooldown] = React.useState(0);

  const emailParam = searchParams.get('email')?.trim() ?? '';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: emailParam, code: '', password: '', confirmPassword: '' },
  });

  const code = watch('code');
  const email = watch('email');

  React.useEffect(() => {
    const stored = sessionStorage.getItem('auth_dev_otp');
    if (stored) setDevOtp(stored);
  }, []);

  React.useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setError('');
    try {
      const result = await resendOtp({ email, purpose: 'reset' }).unwrap();
      if (result.devOtp) {
        setDevOtp(result.devOtp);
        sessionStorage.setItem('auth_dev_otp', result.devOtp);
      }
      setCooldown(30);
      toast.success(
        result.emailDeliveryConfigured
          ? 'A new reset code was sent to your email.'
          : 'A new development reset code was generated below.'
      );
    } catch (resendError) {
      setError(getApiErrorMessage(resendError, 'Could not resend the reset code.'));
    }
  };

  const copyCode = async () => {
    if (!devOtp) return;
    try {
      await navigator.clipboard.writeText(devOtp);
      toast.success('Code copied.');
    } catch {
      toast.error('Your browser blocked clipboard access.');
    }
  };

  const onSubmit = async (values: Values) => {
    setError('');
    try {
      await resetPassword({
        email: values.email,
        code: values.code,
        password: values.password,
      }).unwrap();
      sessionStorage.removeItem('auth_dev_otp');
      toast.success('Password reset. Please sign in.');
      router.replace('/login?reset=1');
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, 'Could not reset your password.'));
    }
  };

  return (
    <div>
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <LockKeyhole className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Choose a new password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter the reset code we sent to{' '}
        <span className="font-semibold text-foreground">{email || 'your email'}</span>, then set a new
        password.
      </p>

      {error ? (
        <Alert variant="error" className="mt-5">
          {error}
        </Alert>
      ) : null}

      {devOtp ? (
        <Alert variant="info" className="mt-5" title="Development mode">
          <p>Email delivery is not configured. Use this reset code:</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-background px-3 py-1 font-mono text-base font-bold tracking-[0.3em]">
              {devOtp}
            </span>
            <Button type="button" size="sm" variant="outline" onClick={copyCode}>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </Button>
          </div>
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="reset-email" className="field-label">
            Email address
          </label>
          <Input
            id="reset-email"
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
            <p className="field-label">Reset code</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0 || !email}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
            >
              <RefreshCcw className={resending ? 'h-3 w-3 animate-spin' : 'h-3 w-3'} />
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
          <OtpInput
            value={code}
            onChange={(value) => setValue('code', value, { shouldValidate: true })}
            disabled={isLoading}
            invalid={Boolean(errors.code)}
          />
          {errors.code ? <p className="field-error">{errors.code.message}</p> : null}
        </div>

        <div>
          <label htmlFor="new-password" className="field-label">
            New password
          </label>
          <PasswordInput
            id="new-password"
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
          <label htmlFor="confirm-password" className="field-label">
            Confirm new password
          </label>
          <PasswordInput
            id="confirm-password"
            autoComplete="new-password"
            placeholder="Repeat your new password"
            invalid={Boolean(errors.confirmPassword)}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword ? <p className="field-error">{errors.confirmPassword.message}</p> : null}
        </div>

        <Button type="submit" size="lg" className="w-full" loading={isLoading}>
          {isLoading ? 'Updating password…' : 'Set new password'}
          {!isLoading ? <ShieldCheck className="h-4 w-4" /> : null}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
          Back to sign in <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </p>
    </div>
  );
}
