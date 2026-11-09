'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from 'next-themes';
import {
  BadgeCheck,
  Bell,
  Camera,
  Check,
  KeyRound,
  Laptop,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
  Trash2,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PasswordInput } from '@/components/auth/password-input';
import { useAuth } from '@/hooks/useAuth';
import {
  useChangePasswordMutation,
  useDeleteAvatarMutation,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} from '@/services/authApi';
import { updateUser } from '@/features/auth/authSlice';
import { useAppDispatch } from '@/store/hooks';
import { getApiErrorMessage } from '@/utils/api-error';
import { cn } from '@/utils/cn';
import { formatDate, formatDateTime } from '@/utils/format';

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80, 'Name is too long'),
  bio: z.string().trim().max(500, 'Bio must be 500 characters or fewer').optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Use at least 8 characters')
      .max(72, 'Password is too long')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [updateProfile, { isLoading: savingProfile }] = useUpdateProfileMutation();
  const [uploadAvatar, { isLoading: uploading }] = useUploadAvatarMutation();
  const [deleteAvatar, { isLoading: deletingAvatar }] = useDeleteAvatarMutation();
  const [changePassword, { isLoading: savingPassword }] = useChangePasswordMutation();
  const [confirmRemove, setConfirmRemove] = React.useState(false);
  const [profileError, setProfileError] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', bio: user?.bio ?? '' },
  });

  React.useEffect(() => {
    if (user) profileForm.reset({ name: user.name, bio: user.bio ?? '' });
    // Only re-sync when the persisted profile changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, user?.name, user?.bio]);

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSaveProfile = async (values: ProfileValues) => {
    setProfileError('');
    try {
      const result = await updateProfile({ name: values.name, bio: values.bio }).unwrap();
      dispatch(updateUser(result.user));
      toast.success('Profile updated.');
    } catch (error) {
      setProfileError(getApiErrorMessage(error, 'Could not update your profile.'));
    }
  };

  const onChangePassword = async (values: PasswordValues) => {
    setPasswordError('');
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }).unwrap();
      toast.success('Password changed. Other sessions remain signed in.');
      passwordForm.reset();
    } catch (error) {
      setPasswordError(getApiErrorMessage(error, 'Could not change your password.'));
    }
  };

  const handleAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('Choose a JPEG, PNG, WebP or GIF image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Images must be 5 MB or smaller.');
      return;
    }
    const formData = new FormData();
    formData.append('image', file);
    try {
      const result = await uploadAvatar(formData).unwrap();
      dispatch(updateUser(result.user ?? { avatar: result.avatar }));
      toast.success('Profile photo updated.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not upload your photo.'));
    }
  };

  const removeAvatar = async () => {
    try {
      const result = await deleteAvatar().unwrap();
      dispatch(updateUser(result.user));
      toast.success('Profile photo removed.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not remove your photo.'));
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow">
          <UserRound className="h-3.5 w-3.5 text-primary" />
          Account
        </span>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, profile photo, password and workspace preferences.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
            <h2 className="text-lg font-bold">Profile</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This is how your name and bio appear on reviews and questions.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-5 rounded-xl border bg-muted/20 p-4">
              <Avatar name={user.name} src={user.avatar?.url || undefined} size="xl" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={handleAvatar}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    loading={uploading}
                  >
                    <Camera className="h-3.5 w-3.5" />
                    {user.avatar?.url ? 'Change photo' : 'Upload photo'}
                  </Button>
                  {user.avatar?.url ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setConfirmRemove(true)}
                      loading={deletingAvatar}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  ) : null}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  JPEG, PNG, WebP or GIF up to 5 MB. Stored on Cloudinary when configured.
                </p>
              </div>
            </div>

            {profileError ? (
              <Alert variant="error" className="mt-4">
                {profileError}
              </Alert>
            ) : null}

            <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="mt-5 space-y-4" noValidate>
              <div>
                <label htmlFor="profile-name" className="field-label">
                  Full name
                </label>
                <Input
                  id="profile-name"
                  icon={<UserRound className="h-4 w-4" />}
                  invalid={Boolean(profileForm.formState.errors.name)}
                  {...profileForm.register('name')}
                />
                {profileForm.formState.errors.name ? (
                  <p className="field-error">{profileForm.formState.errors.name.message}</p>
                ) : null}
              </div>
              <div>
                <label htmlFor="profile-email" className="field-label">
                  Email address
                </label>
                <Input
                  id="profile-email"
                  value={user.email}
                  readOnly
                  disabled
                  icon={<Mail className="h-4 w-4" />}
                />
                <p className="field-hint">Email changes are not available in this version.</p>
              </div>
              <div>
                <label htmlFor="profile-bio" className="field-label">
                  Bio
                </label>
                <Textarea
                  id="profile-bio"
                  rows={4}
                  placeholder="What are you building or learning?"
                  invalid={Boolean(profileForm.formState.errors.bio)}
                  {...profileForm.register('bio')}
                />
                <div className="flex items-center justify-between gap-2">
                  {profileForm.formState.errors.bio ? (
                    <p className="field-error">{profileForm.formState.errors.bio.message}</p>
                  ) : (
                    <p className="field-hint">Optional. Up to 500 characters.</p>
                  )}
                </div>
              </div>
              <Button type="submit" loading={savingProfile}>
                <Check className="h-4 w-4" />
                Save profile
              </Button>
            </form>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <KeyRound className="h-5 w-5 text-primary" />
              Password
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a strong password. You will stay signed in on this device.
            </p>

            {passwordError ? (
              <Alert variant="error" className="mt-4">
                {passwordError}
              </Alert>
            ) : null}

            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="mt-5 space-y-4" noValidate>
              <div>
                <label htmlFor="current-password" className="field-label">
                  Current password
                </label>
                <PasswordInput
                  id="current-password"
                  autoComplete="current-password"
                  invalid={Boolean(passwordForm.formState.errors.currentPassword)}
                  {...passwordForm.register('currentPassword')}
                />
                {passwordForm.formState.errors.currentPassword ? (
                  <p className="field-error">{passwordForm.formState.errors.currentPassword.message}</p>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="new-password" className="field-label">
                    New password
                  </label>
                  <PasswordInput
                    id="new-password"
                    autoComplete="new-password"
                    invalid={Boolean(passwordForm.formState.errors.newPassword)}
                    {...passwordForm.register('newPassword')}
                  />
                  {passwordForm.formState.errors.newPassword ? (
                    <p className="field-error">{passwordForm.formState.errors.newPassword.message}</p>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="confirm-new-password" className="field-label">
                    Confirm new password
                  </label>
                  <PasswordInput
                    id="confirm-new-password"
                    autoComplete="new-password"
                    invalid={Boolean(passwordForm.formState.errors.confirmPassword)}
                    {...passwordForm.register('confirmPassword')}
                  />
                  {passwordForm.formState.errors.confirmPassword ? (
                    <p className="field-error">{passwordForm.formState.errors.confirmPassword.message}</p>
                  ) : null}
                </div>
              </div>
              <p className="field-hint">Minimum 8 characters with uppercase, lowercase and a number.</p>
              <Button type="submit" loading={savingPassword}>
                Update password
              </Button>
            </form>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border bg-card p-5 shadow-soft">
            <h2 className="text-base font-bold">Account</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Role</dt>
                <dd>
                  <Badge variant={user.role === 'admin' ? 'primary' : 'secondary'} className="capitalize">
                    {user.role}
                  </Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Email status</dt>
                <dd className="flex items-center gap-1.5 font-medium text-success">
                  {user.isVerified ? (
                    <>
                      <BadgeCheck className="h-4 w-4" />
                      Verified
                    </>
                  ) : (
                    'Unverified'
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Member since</dt>
                <dd className="font-medium">{formatDate(user.createdAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Last sign in</dt>
                <dd className="text-right text-xs font-medium">{formatDateTime(user.lastLoginAt)}</dd>
              </div>
            </dl>
            <Link
              href="/notifications"
              className="mt-4 flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              <span className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Notifications
              </span>
              <span className="text-muted-foreground">→</span>
            </Link>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-soft">
            <h2 className="text-base font-bold">Appearance</h2>
            <p className="mt-1 text-xs text-muted-foreground">Choose how the workspace looks.</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'system', label: 'System', icon: Laptop },
              ].map((option) => {
                const active = mounted && theme === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition-colors',
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted'
                    )}
                    aria-pressed={active}
                  >
                    <option.icon className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
            {mounted ? (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Currently using the {resolvedTheme ?? 'light'} theme.
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-soft">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Security
            </h2>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
              <li className="flex gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                Sessions use HTTP-only access and refresh cookies.
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                Passwords are hashed with bcrypt and never exposed.
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                Lesson videos are signed per request for enrolled students.
              </li>
            </ul>
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={removeAvatar}
        title="Remove profile photo?"
        description="Your avatar will revert to your initials. You can upload a new photo at any time."
        confirmLabel="Remove photo"
        destructive
      />
    </div>
  );
}
