'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export function useRequireAuth({ adminOnly = false }: { adminOnly?: boolean } = {}) {
  const { user, status, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (status === 'guest') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (status === 'authenticated' && adminOnly && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [status, adminOnly, isAdmin, pathname, router]);

  const ready =
    status === 'authenticated' && Boolean(user) && (!adminOnly || user?.role === 'admin');

  return { user, status, ready };
}
