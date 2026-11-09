import { useAppSelector } from '@/store/hooks';

export function useAuth() {
  const user = useAppSelector((state) => state.auth.user);
  const status = useAppSelector((state) => state.auth.status);
  return {
    user,
    status,
    isAuthenticated: status === 'authenticated' && Boolean(user),
    isAdmin: user?.role === 'admin',
    isLoading: status === 'loading',
  };
}
