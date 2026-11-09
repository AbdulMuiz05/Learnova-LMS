'use client';

import * as React from 'react';
import {
  BookOpen,
  FolderTree,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { DynamicIcon } from '@/components/dynamic-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetAdminCategoriesQuery,
  useUpdateCategoryMutation,
} from '@/services/categoryApi';
import type { Category } from '@/types';
import { formatNumber } from '@/utils/format';

const ICON_OPTIONS = [
  'BookOpen',
  'Code2',
  'Database',
  'Cloud',
  'ShieldCheck',
  'Brain',
  'Cpu',
  'Smartphone',
  'BarChart3',
  'Megaphone',
  'Palette',
  'PenTool',
  'Server',
  'Rocket',
  'Globe',
  'Users',
  'Sparkles',
  'Award',
  'Target',
  'TrendingUp',
];

interface CategoryDraft {
  name: string;
  description: string;
  icon: string;
  order: string;
  isActive: boolean;
}

const emptyDraft: CategoryDraft = {
  name: '',
  description: '',
  icon: 'BookOpen',
  order: '0',
  isActive: true,
};

export default function AdminCategoriesPage() {
  const { data, isLoading, isError, refetch, isFetching } = useGetAdminCategoriesQuery();
  const [createCategory, { isLoading: creating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: updating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: deleting }] = useDeleteCategoryMutation();

  const [editor, setEditor] = React.useState<{ open: boolean; category?: Category; draft: CategoryDraft }>({
    open: false,
    draft: emptyDraft,
  });
  const [toDelete, setToDelete] = React.useState<Category | null>(null);

  const categories = data?.categories ?? [];
  const activeCount = categories.filter((category) => category.isActive).length;

  const openCreate = () => {
    setEditor({
      open: true,
      draft: { ...emptyDraft, order: String(categories.length) },
    });
  };

  const openEdit = (category: Category) => {
    setEditor({
      open: true,
      category,
      draft: {
        name: category.name,
        description: category.description ?? '',
        icon: category.icon || 'BookOpen',
        order: String(category.order ?? 0),
        isActive: category.isActive,
      },
    });
  };

  const save = async () => {
    const draft = editor.draft;
    if (draft.name.trim().length < 2) {
      toast.error('Category name needs at least 2 characters.');
      return;
    }
    const payload = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      icon: draft.icon,
      order: Number(draft.order) || 0,
      isActive: draft.isActive,
    };
    try {
      if (editor.category) {
        await updateCategory({ id: editor.category._id, body: payload }).unwrap();
        toast.success('Category updated');
      } else {
        await createCategory(payload).unwrap();
        toast.success('Category created');
      }
      setEditor({ open: false, draft: emptyDraft });
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ?? 'Could not save category'
      );
    }
  };

  const toggleActive = async (category: Category) => {
    try {
      await updateCategory({
        id: category._id,
        body: { isActive: !category.isActive },
      }).unwrap();
      toast.success(category.isActive ? 'Category hidden' : 'Category activated');
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ?? 'Could not update category'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">
            <FolderTree className="h-3.5 w-3.5 text-primary" />
            Catalog structure
          </span>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatNumber(categories.length)} categories · {formatNumber(activeCount)} visible in the catalog.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New category
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={RefreshCcw}
          title="Categories could not load"
          description="The catalog service did not respond."
          action={
            <Button onClick={() => refetch()} loading={isFetching}>
              <RefreshCcw className="h-4 w-4" />
              Retry
            </Button>
          }
        />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No categories yet"
          description="Create categories to group courses and power catalog filters."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Create category
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <article
              key={category._id}
              className="flex flex-col rounded-2xl border bg-card p-5 shadow-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <DynamicIcon name={category.icon} className="h-5 w-5" />
                </span>
                <Badge variant={category.isActive ? 'success' : 'secondary'}>
                  {category.isActive ? 'Active' : 'Hidden'}
                </Badge>
              </div>
              <h2 className="mt-3 text-base font-bold">{category.name}</h2>
              <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">/{category.slug}</p>
              <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
                {category.description || 'No description yet.'}
              </p>
              <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  {formatNumber(category.courseCount ?? 0)} {category.courseCount === 1 ? 'course' : 'courses'}
                </span>
                <span>Order {category.order}</span>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <Button variant="outline" size="sm" onClick={() => openEdit(category)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleActive(category)}>
                  {category.isActive ? 'Hide' : 'Show'}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="ml-auto text-destructive hover:bg-destructive/10"
                  onClick={() => setToDelete(category)}
                  aria-label="Delete category"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={editor.open}
        onClose={() => setEditor({ open: false, draft: emptyDraft })}
        title={editor.category ? 'Edit category' : 'New category'}
        description="Categories group courses and appear in catalog filters."
        footer={
          <>
            <Button variant="outline" onClick={() => setEditor({ open: false, draft: emptyDraft })}>
              Cancel
            </Button>
            <Button onClick={save} loading={creating || updating}>
              {editor.category ? 'Save changes' : 'Create category'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold">Name</label>
            <Input
              value={editor.draft.name}
              onChange={(event) =>
                setEditor((current) => ({
                  ...current,
                  draft: { ...current.draft, name: event.target.value },
                }))
              }
              className="mt-1.5"
              placeholder="e.g. Software Engineering"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-semibold">Description</label>
            <Textarea
              value={editor.draft.description}
              onChange={(event) =>
                setEditor((current) => ({
                  ...current,
                  draft: { ...current.draft, description: event.target.value },
                }))
              }
              className="mt-1.5"
              rows={3}
              maxLength={300}
              placeholder="Short description used on category cards."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold">Icon</label>
              <Select
                value={editor.draft.icon}
                onChange={(event) =>
                  setEditor((current) => ({
                    ...current,
                    draft: { ...current.draft, icon: event.target.value },
                  }))
                }
                className="mt-1.5"
              >
                {ICON_OPTIONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold">Display order</label>
              <Input
                value={editor.draft.order}
                onChange={(event) =>
                  setEditor((current) => ({
                    ...current,
                    draft: { ...current.draft, order: event.target.value },
                  }))
                }
                className="mt-1.5"
                inputMode="numeric"
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 p-3">
            <div>
              <p className="text-sm font-medium">Visible in catalog</p>
              <p className="text-[11px] text-muted-foreground">
                Hidden categories remain attached to existing courses but are not listed.
              </p>
            </div>
            <Switch
              checked={editor.draft.isActive}
              onCheckedChange={(checked) =>
                setEditor((current) => ({
                  ...current,
                  draft: { ...current.draft, isActive: checked },
                }))
              }
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await deleteCategory(toDelete._id).unwrap();
            toast.success('Category deleted');
            setToDelete(null);
          } catch (error) {
            toast.error(
              (error as { data?: { message?: string } })?.data?.message ??
                'Could not delete category'
            );
          }
        }}
        title="Delete this category?"
        description={`“${toDelete?.name ?? ''}” will be removed. Categories that still contain courses cannot be deleted.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete category'}
        destructive
      />
    </div>
  );
}
