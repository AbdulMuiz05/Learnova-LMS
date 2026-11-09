'use client';

import * as React from 'react';
import {
  CheckCircle2,
  Cloud,
  CreditCard,
  Globe2,
  Mail,
  RefreshCcw,
  Save,
  Settings,
  TriangleAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useGetPaymentConfigQuery } from '@/services/paymentApi';
import { useGetAdminSiteContentQuery, useUpdateSettingsMutation } from '@/services/siteApi';
import { useGetUploadStatusQuery } from '@/services/uploadApi';
import type { SiteSettings } from '@/types';

export default function AdminSettingsPage() {
  const { data, isLoading, isError, refetch, isFetching } = useGetAdminSiteContentQuery();
  const [updateSettings, { isLoading: saving }] = useUpdateSettingsMutation();
  const { data: paymentConfig } = useGetPaymentConfigQuery();
  const { data: uploadStatus } = useGetUploadStatusQuery();

  const [settings, setSettings] = React.useState<SiteSettings | null>(null);
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    if (data?.settings) {
      setSettings(data.settings);
      setDirty(false);
    }
  }, [data]);

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setSettings((current) => (current ? { ...current, [key]: value } : current));
    setDirty(true);
  };

  const setSocial = (key: keyof SiteSettings['socials'], value: string) => {
    setSettings((current) =>
      current ? { ...current, socials: { ...current.socials, [key]: value } } : current
    );
    setDirty(true);
  };

  const save = async () => {
    if (!settings) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.supportEmail)) {
      toast.error('Enter a valid support email.');
      return;
    }
    if (!/^[a-z]{3}$/i.test(settings.currency)) {
      toast.error('Currency must be a 3-letter ISO code, e.g. usd.');
      return;
    }
    try {
      await updateSettings({
        ...settings,
        currency: settings.currency.toLowerCase(),
      }).unwrap();
      toast.success('Site settings saved');
      setDirty(false);
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ?? 'Could not save settings'
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={RefreshCcw}
        title="Settings could not load"
        description="The site settings service did not respond."
        action={
          <Button onClick={() => refetch()} loading={isFetching}>
            <RefreshCcw className="h-4 w-4" />
            Retry
          </Button>
        }
      />
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">
            <Settings className="h-3.5 w-3.5 text-primary" />
            Configuration
          </span>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Brand, contact details and social profiles used across the storefront, emails and invoices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty ? <Badge variant="warning">Unsaved changes</Badge> : null}
          <Button onClick={save} loading={saving} disabled={!dirty}>
            <Save className="h-4 w-4" />
            Save settings
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Globe2 className="h-4 w-4 text-primary" />
              Brand
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold">Site name</label>
                <Input
                  value={settings.siteName}
                  onChange={(event) => set('siteName', event.target.value)}
                  className="mt-1.5"
                  maxLength={80}
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Currency (ISO 4217)</label>
                <Input
                  value={settings.currency}
                  onChange={(event) => set('currency', event.target.value)}
                  className="mt-1.5"
                  maxLength={3}
                  placeholder="usd"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs font-semibold">Tagline</label>
              <Input
                value={settings.tagline}
                onChange={(event) => set('tagline', event.target.value)}
                className="mt-1.5"
                maxLength={160}
                placeholder="Learn. Build. Ship."
              />
            </div>
            <div className="mt-4">
              <label className="text-xs font-semibold">Footer text</label>
              <Textarea
                value={settings.footerText}
                onChange={(event) => set('footerText', event.target.value)}
                className="mt-1.5"
                rows={2}
                maxLength={400}
              />
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Mail className="h-4 w-4 text-primary" />
              Contact details
            </h2>
            <p className="text-xs text-muted-foreground">
              Displayed on the contact page, footer and invoice documents.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold">Support email</label>
                <Input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(event) => set('supportEmail', event.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Phone</label>
                <Input
                  value={settings.phone}
                  onChange={(event) => set('phone', event.target.value)}
                  className="mt-1.5"
                  maxLength={60}
                  placeholder="+1 555 000 0000"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs font-semibold">Address</label>
              <Input
                value={settings.address}
                onChange={(event) => set('address', event.target.value)}
                className="mt-1.5"
                maxLength={200}
                placeholder="City, country"
              />
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
            <h2 className="text-base font-bold">Social profiles</h2>
            <p className="text-xs text-muted-foreground">Leave blank to hide a network in the footer.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(
                [
                  ['twitter', 'Twitter / X'],
                  ['facebook', 'Facebook'],
                  ['linkedin', 'LinkedIn'],
                  ['youtube', 'YouTube'],
                  ['instagram', 'Instagram'],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs font-semibold">{label}</label>
                  <Input
                    value={settings.socials?.[key] ?? ''}
                    onChange={(event) => setSocial(key, event.target.value)}
                    className="mt-1.5"
                    placeholder={`https://${key}.com/learnova`}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-2xl border bg-card p-5 shadow-soft">
            <h2 className="text-sm font-bold">Integration status</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Credentials live in server environment variables, never in this UI.
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <IntegrationRow
                icon={CreditCard}
                label="Payments"
                configured={paymentConfig?.provider === 'stripe'}
                detail={
                  paymentConfig?.provider === 'stripe'
                    ? 'Stripe checkout and webhook configured'
                    : paymentConfig?.provider === 'demo'
                      ? 'Demo checkout mode (no real charges)'
                      : 'No payment provider configured'
                }
              />
              <IntegrationRow
                icon={Cloud}
                label="Cloudinary"
                configured={Boolean(uploadStatus?.cloudinary)}
                detail={
                  uploadStatus?.cloudinary
                    ? 'Signed image and video uploads enabled'
                    : 'Media uploads disabled — external URLs only'
                }
              />
              <div className="flex items-start gap-2.5 rounded-xl border bg-muted/30 p-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs font-semibold">OTP email</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Configure SMTP variables on the server. In development, the API response includes the
                    OTP when email delivery is unavailable.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-soft">
            <h2 className="text-sm font-bold">Security notes</h2>
            <ul className="mt-3 space-y-2 text-[11px] leading-5 text-muted-foreground">
              <li>• Admin APIs are protected by server-side role checks, not just hidden routes.</li>
              <li>• Payment access is granted only after verified webhook or demo confirmation.</li>
              <li>• Video delivery URLs are signed per request and never stored in public pages.</li>
              <li>• Access and refresh tokens are HTTP-only cookies; refresh tokens rotate.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

function IntegrationRow({
  icon: Icon,
  label,
  configured,
  detail,
}: {
  icon: typeof CreditCard;
  label: string;
  configured: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-xs font-semibold">
          {label}
          {configured ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          ) : (
            <TriangleAlert className="h-3.5 w-3.5 text-amber-500" />
          )}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
