'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Bell,
  BookOpen,
  CreditCard,
  ExternalLink,
  FileText,
  FolderTree,
  GraduationCap,
  LayoutDashboard,
  Menu,
  MessageCircleQuestion,
  Settings,
  ShieldCheck,
  Star,
  Users,
  X,
} from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import { NotificationBell } from '@/components/layout/notification-bell';
import { UserMenu } from '@/components/layout/user-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/spinner';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { cn } from '@/utils/cn';

const groups = [
  {
    label: 'Main',
    items: [
      { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Manage',
    items: [
      { href: '/admin/courses', label: 'Courses', icon: BookOpen },
      { href: '/admin/categories', label: 'Categories', icon: FolderTree },
      { href: '/admin/students', label: 'Students', icon: Users },
    ],
  },
  {
    label: 'Sales',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: CreditCard },
      { href: '/admin/invoices', label: 'Invoices', icon: FileText },
    ],
  },
  {
    label: 'Engagement',
    items: [
      { href: '/admin/questions', label: 'Questions', icon: MessageCircleQuestion },
      { href: '/admin/reviews', label: 'Reviews', icon: Star },
      { href: '/admin/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    label: 'Website',
    items: [
      { href: '/admin/website', label: 'Customization', icon: GraduationCap },
      { href: '/admin/faqs', label: 'FAQs', icon: FileText },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, status } = useRequireAuth({ adminOnly: true });
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const allItems = groups.flatMap((group) => group.items);
  const current = [...allItems]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href)));

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageLoader
          label={status === 'guest' ? 'Redirecting to sign in' : 'Checking administrator access'}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px] lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-sidebar transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-5">
          <Logo compact />
          <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
            <ShieldCheck className="h-3 w-3" />
            Admin
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5 scrollbar-thin" aria-label="Admin navigation">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/70">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors',
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
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t p-3">
          <Link
            href="/"
            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            View storefront
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-xl sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Admin console
            </p>
            <h1 className="truncate text-base font-semibold">{current?.label ?? 'Dashboard'}</h1>
          </div>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <NotificationBell />
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
