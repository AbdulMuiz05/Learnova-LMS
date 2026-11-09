'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Search, X } from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import { UserMenu } from '@/components/layout/user-menu';
import { NotificationBell } from '@/components/layout/notification-bell';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button, buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

const links = [
  { href: '/', label: 'Home' },
  { href: '/courses', label: 'Courses' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = search.trim();
    router.push(query ? `/courses?search=${encodeURIComponent(query)}` : '/courses');
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-7">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {links.map((link) => {
              const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pathname.startsWith('/dashboard')
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                My learning
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <form onSubmit={submitSearch} className="relative hidden xl:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search courses…"
              aria-label="Search courses"
              className="h-9 w-52 rounded-full border bg-muted/50 pl-9 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground/70 focus:w-64 focus:border-primary focus:bg-card focus:ring-2 focus:ring-ring/20"
            />
          </form>
          <ThemeToggle />
          <NotificationBell />
          <UserMenu />
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t bg-background lg:hidden">
          <div className="container-page space-y-3 py-4">
            <form onSubmit={submitSearch} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search courses…"
                aria-label="Search courses"
                className="h-10 w-full rounded-lg border bg-muted/50 pl-9 pr-3 text-sm outline-none focus:border-primary focus:bg-card"
              />
            </form>
            <nav className="grid gap-1" aria-label="Mobile navigation">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  My learning
                </Link>
              ) : null}
            </nav>
            {!isAuthenticated ? (
              <div className="flex gap-2 pt-1">
                <Link href="/login" className={cn(buttonVariants({ variant: 'outline' }), 'flex-1')}>
                  Sign in
                </Link>
                <Link href="/register" className={cn(buttonVariants(), 'flex-1')}>
                  Get started
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
