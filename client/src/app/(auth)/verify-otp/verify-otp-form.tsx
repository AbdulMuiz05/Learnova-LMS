'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Copy, MailCheck, Pencil, RefreshCcw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { OtpInput } from '@/components/auth/otp-input';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useResendOtpMutation, useVerifyOtpMutation } from '@/services/authApi';
import { baseApi } from '@/services/baseApi';
import { setCredentials } from '@/features/auth/authSlice';
import { useAppDispatch } from '@/store/hooks';
import { getApiErrorCode, getApiErrorMessage } from '@/utils/api-error';

export function VerifyOtpForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const [verifyOtp, { isLoading: verifying }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: resending }] = useResendOtpMutation();

  const nextParam = searchParams.get('next');
  const next =
    nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : null;

  const [email, setEmail] = React.useState(() => searchParams.get('email')?.trim() ?? '');
  const [emailDraft, setEmailDraft] = React.useState(email);
  const [editingEmail, setEditingEmail] = React.useState(!email);
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');
  const [devOtp, setDevOtp] = React.useState<string | null>(null);
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    const stored = sessionStorage.getItem('auth_dev_otp');
    if (stored) setDevOtp(stored);
    const pending = sessionStorage.getItem('auth_pending_email');
    if (!searchParams.get('email') && pending) {
      setEmail(pending);
      setEmailDraft(pending);
      setEditingEmail(false);
    }
  }, [searchParams]);

  React.useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(next || (isAdmin ? '/admin' : '/dashboard'));
    }
  }, [authLoading, isAuthenticated, isAdmin, next, router]);

  const saveEmail = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = emailDraft.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError('Enter a valid email address.');
      return;
    }
    setEmail(trimmed);
    setEditingEmail(false);
    setError('');
    sessionStorage.setItem('auth_pending_email', trimmed);
    const query = new URLSearchParams({ email: trimmed });
    if (next) query.set('next', next);
    router.replace(`/verify-otp?${query.toString()}`);
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) {
      setEditingEmail(true);
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setError('');
    try {
      const result = await verifyOtp({ email, code }).unwrap();
      dispatch(setCredentials(result.user));
      dispatch(baseApi.util.resetApiState());
      sessionStorage.removeItem('auth_dev_otp');
      sessionStorage.removeItem('auth_pending_email');
      toast.success('Email verified. Welcome to Learnova!');
      router.replace(next || (result.user.role === 'admin' ? '/admin' : '/dashboard'));
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, 'Verification failed. Please try again.'));
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setError('');
    try {
      const result = await resendOtp({ email, purpose: 'verify' }).unwrap();
      if (result.devOtp) {
        setDevOtp(result.devOtp);
        sessionStorage.setItem('auth_dev_otp', result.devOtp);
      }
      setCooldown(30);
      toast.success(
        result.emailDeliveryConfigured
          ? 'A new code was sent to your email.'
          : 'A new development code was generated below.'
      );
    } catch (resendError) {
      if (getApiErrorCode(resendError) === 'ALREADY_VERIFIED') {
        toast.info('This email is already verified. Please sign in.');
        router.replace('/login');
        return;
      }
      setError(getApiErrorMessage(resendError, 'Could not resend the code.'));
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

  return (
    <div>
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <MailCheck className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Verify your email</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We sent a six-digit verification code to{' '}
        {email ? <span className="font-semibold text-foreground">{email}</span> : 'your inbox'}.
        Enter it below to activate your account.
      </p>

      {error ? (
        <Alert variant="error" className="mt-5">
          {error}
        </Alert>
      ) : null}

      {devOtp ? (
        <Alert variant="info" className="mt-5" title="Development mode">
          <p>
            Email delivery is not configured, so the code is shown here instead of being sent by SMTP:
          </p>
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

      {editingEmail ? (
        <form onSubmit={saveEmail} className="mt-6 space-y-4">
          <div>
            <label htmlFor="verify-email" className="field-label">
              Email address
            </label>
            <Input
              id="verify-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              icon={<MailCheck className="h-4 w-4" />}
              value={emailDraft}
              onChange={(event) => setEmailDraft(event.target.value)}
            />
          </div>
          <Button type="submit" size="lg" className="w-full">
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="mt-6 space-y-5">
          <div>
            <p className="field-label">Verification code</p>
            <OtpInput value={code} onChange={setCode} disabled={verifying} invalid={Boolean(error)} />
            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmailDraft(email);
                  setEditingEmail(true);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-3 w-3" />
                Use a different email
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
              >
                <RefreshCcw className={resending ? 'h-3 w-3 animate-spin' : 'h-3 w-3'} />
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" loading={verifying} disabled={code.length !== 6}>
            {verifying ? 'Verifying…' : 'Verify email'}
            {!verifying ? <ShieldCheck className="h-4 w-4" /> : null}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already verified?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
        <span className="mx-2 text-border">·</span>
        Need a new account?{' '}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
