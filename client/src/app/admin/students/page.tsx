'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Eye,
  RefreshCcw,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAdminUsersQuery, useUpdateAdminUserMutation } from '@/services/adminApi';
import type { User } from '@/types';
import { formatDate, formatNumber } from '@/utils/format';

export default function AdminStudentsPage() {
  const [search, setSearch] = React.useState('');
  const deferredSearch = React.useDeferredValue(search);
  const [role, setRole] = React.useState('');
  const [active, setActive] = React.useState('');
  const [page, setPage] = React.useState(1);

  const { data, isLoading, isError, refetch, isFetching } = useGetAdminUsersQuery({
    page,
    limit: 15,
    search: deferredSearch || undefined,
    role: role || undefined,
    active: active || undefined,
  });
  const [updateUser] = useUpdateAdminUserMutation();

  React.useEffect(() => {
    setPage(1);
  }, [deferredSearch, role, active]);

  const toggleActive = async (user: User) => {
    try {
      await updateUser({ userId: user._id, body: { isActive: !user.isActive } }).unwrap();
      toast.success(user.isActive ? 'Account deactivated' : 'Account activated');
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ?? 'Could not update account'
      );
    }
  };

  const users = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow">
          <Users className="h-3.5 w-3.5 text-primary" />
          People
        </span>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Students & accounts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review enrollments, adjust roles and deactivate accounts. Role and status changes take effect
          on the server immediately.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or email…"
          icon={<Search className="h-4 w-4" />}
          className="sm:max-w-sm"
          aria-label="Search users"
        />
        <Select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          aria-label="Filter by role"
          className="sm:w-40"
        >
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="admin">Admins</option>
        </Select>
        <Select
          value={active}
          onChange={(event) => setActive(event.target.value)}
          aria-label="Filter by status"
          className="sm:w-40"
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Deactivated</option>
        </Select>
        {meta ? (
          <span className="text-xs text-muted-foreground sm:ml-auto">
            {formatNumber(meta.total)} account{meta.total === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={RefreshCcw}
          title="Accounts could not load"
          description="The user service did not respond. Check the API and retry."
          action={
            <Button onClick={() => refetch()} loading={isFetching}>
              <RefreshCcw className="h-4 w-4" />
              Retry
            </Button>
          }
        />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No accounts match these filters"
          description="Try a different search or clear the role and status filters."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Account</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Enrollments</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user._id} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} src={user.avatar?.url} size="sm" />
                        <div className="min-w-0">
                          <Link
                            href={`/admin/students/${user._id}`}
                            className="truncate font-semibold hover:text-primary"
                          >
                            {user.name}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' ? (
                          <>
                            <ShieldCheck className="h-3 w-3" />
                            Admin
                          </>
                        ) : (
                          'Student'
                        )}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatNumber(user.enrollmentCount ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.isActive ? 'success' : 'destructive'}>
                        {user.isActive ? 'Active' : 'Deactivated'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(user)}
                          title={user.isActive ? 'Deactivate account' : 'Activate account'}
                        >
                          {user.isActive ? (
                            <>
                              <UserX className="h-3.5 w-3.5" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3.5 w-3.5" />
                              Activate
                            </>
                          )}
                        </Button>
                        <Link
                          href={`/admin/students/${user._id}`}
                          className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                          aria-label="View account"
                          title="View account"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 text-xs text-muted-foreground">
              <span>
                Showing {users.length} of {formatNumber(meta.total)} accounts
              </span>
              <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
