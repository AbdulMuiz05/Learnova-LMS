'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, KeyRound, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForgotPasswordMutation } from '@/services/authApi';
import { getApiErrorMessage } from '@/utils/api-error';

const schema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
});

type Values = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const router = useRouter();
  const [error, setError] = React.useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: Values) => {
    setError('');
    try {
      const result = await forgotPassword({ email: values.email }).unwrap();
      sessionStorage.setItem('auth_pending_email', values.email);
      if (result.devOtp) sessionStorage.setItem('auth_dev_otp', result.devOtp);
      else sessionStorage.removeItem('auth_dev_otp');

      toast.success('If that account exists, a reset code has been sent.');
      router.push(`/reset-password?email=${encodeURIComponent(values.email)}`);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, 'Could not request a reset code.'));
    }
  };

  return (
    <div>
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <KeyRound className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Reset your password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter the email linked to your account. We will send a six-digit code you can use to choose a
        new password.
      </p>

      {error ? (
        <Alert variant="error" className="mt-5">
          {error}
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

        <Button type="submit" size="lg" className="w-full" loading={isLoading}>
          {isLoading ? 'Sending code…' : 'Send reset code'}
          {!isLoading ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
      </form>

      <div className="mt-6 rounded-xl border bg-muted/30 p-4 text-xs leading-5 text-muted-foreground">
        For security, we return the same response whether or not an account exists. Codes expire after
        10 minutes and can only be used once.
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
