'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Settings, ShieldCheck, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useAppDispatch } from '@/store/hooks';
import { useAuth } from '@/hooks/useAuth';
import { clearCredentials } from '@/features/auth/authSlice';
import { baseApi } from '@/services/baseApi';
import { useLogoutMutation } from '@/services/authApi';
import { cn } from '@/utils/cn';

export function UserMenu() {
  const { user, status } = useAuth();
  const [open, setOpen] = React.useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [logout, { isLoading }] = useLogoutMutation();

  if (status === 'loading') {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-muted" aria-hidden />;
  }

  if (status === 'guest' || !user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          Sign in
        </Link>
        <Link href="/register" className={cn(buttonVariants({ size: 'sm' }), 'hidden sm:inline-flex')}>
          Get started
        </Link>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {
      // Signing out locally still makes sense if the session already expired.
    }
    dispatch(clearCredentials());
    dispatch(baseApi.util.resetApiState());
    toast.success('Signed out');
    setOpen(false);
    router.push('/');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted/60"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={user.name} src={user.avatar?.url} size="sm" />
        <span className="hidden max-w-[110px] truncate md:block">{user.name.split(' ')[0]}</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border bg-card p-1.5 shadow-xl animate-fade-up"
        >
          <div className="border-b px-3 py-2.5">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
              {user.role}
            </span>
          </div>
          <MenuItem href="/dashboard" icon={LayoutDashboard} onClick={() => setOpen(false)}>
            My learning
          </MenuItem>
          {user.role === 'admin' ? (
            <MenuItem href="/admin" icon={ShieldCheck} onClick={() => setOpen(false)}>
              Admin dashboard
            </MenuItem>
          ) : null}
          <MenuItem href="/dashboard/settings" icon={Settings} onClick={() => setOpen(false)}>
            Account settings
          </MenuItem>
          <MenuItem href="/dashboard/settings" icon={UserRound} onClick={() => setOpen(false)}>
            Profile
          </MenuItem>
          <div className="my-1 border-t" />
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoading}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
            role="menuitem"
          >
            <LogOut className="h-4 w-4" />
            {isLoading ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  href,
  icon: Icon,
  children,
  onClick,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      role="menuitem"
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}
