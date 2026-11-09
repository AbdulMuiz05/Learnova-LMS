'use client';

import * as React from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { store } from '@/store';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials, setGuest } from '@/features/auth/authSlice';
import { useGetMeQuery } from '@/services/authApi';
import { RealtimeNotifications } from '@/components/realtime-notifications';

function AuthSync() {
  const dispatch = useAppDispatch();
  const { data, isSuccess, isError } = useGetMeQuery();

  React.useEffect(() => {
    if (isSuccess && data?.user) {
      dispatch(setCredentials(data.user));
    } else if (isError) {
      dispatch(setGuest());
    }
  }, [data, isSuccess, isError, dispatch]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <AuthSync />
        <RealtimeNotifications />
        {children}
        <Toaster position="top-right" richColors closeButton toastOptions={{ duration: 4000 }} />
      </ThemeProvider>
    </Provider>
  );
}
