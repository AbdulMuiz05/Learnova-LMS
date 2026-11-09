'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CreditCard,
  LayoutDashboard,
  Library,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { PageLoader } from '@/components/ui/spinner';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { cn } from '@/utils/cn';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/courses', label: 'My courses', icon: Library },
  { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, ready, status } = useRequireAuth();

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center">
          <PageLoader label={status === 'guest' ? 'Redirecting to sign in' : 'Preparing your dashboard'} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container-page flex-1 py-8 sm:py-10">
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="lg:w-60 lg:shrink-0">
            <div className="rounded-2xl border bg-card p-4 shadow-soft lg:sticky lg:top-24">
              <div className="mb-4 hidden items-center gap-3 border-b pb-4 lg:flex">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {user?.name?.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{user?.name}</p>
                  <p className="truncate text-xs text-muted-foreground">Student workspace</p>
                </div>
              </div>
              <nav className="flex gap-1 overflow-x-auto no-scrollbar lg:flex-col" aria-label="Dashboard navigation">
                {navItems.map((item) => {
                  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
                {user?.role === 'admin' ? (
                  <Link
                    href="/admin"
                    className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Admin console
                  </Link>
                ) : null}
              </nav>
            </div>
          </aside>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
