'use client';

import * as React from 'react';
import {
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateFaqMutation,
  useDeleteFaqMutation,
  useGetAllFaqsQuery,
  useUpdateFaqMutation,
} from '@/services/siteApi';
import type { Faq } from '@/types';

interface FaqDraft {
  question: string;
  answer: string;
  order: string;
  isActive: boolean;
}

const emptyDraft: FaqDraft = { question: '', answer: '', order: '0', isActive: true };

export default function AdminFaqsPage() {
  const { data, isLoading, isError, refetch, isFetching } = useGetAllFaqsQuery();
  const [createFaq, { isLoading: creating }] = useCreateFaqMutation();
  const [updateFaq, { isLoading: updating }] = useUpdateFaqMutation();
  const [deleteFaq, { isLoading: deleting }] = useDeleteFaqMutation();

  const [editor, setEditor] = React.useState<{ open: boolean; faq?: Faq; draft: FaqDraft }>({
    open: false,
    draft: emptyDraft,
  });
  const [toDelete, setToDelete] = React.useState<Faq | null>(null);

  const faqs = data?.faqs ?? [];

  const openCreate = () =>
    setEditor({ open: true, draft: { ...emptyDraft, order: String(faqs.length) } });

  const openEdit = (faq: Faq) =>
    setEditor({
      open: true,
      faq,
      draft: {
        question: faq.question,
        answer: faq.answer,
        order: String(faq.order ?? 0),
        isActive: faq.isActive,
      },
    });

  const save = async () => {
    const draft = editor.draft;
    if (draft.question.trim().length < 5) {
      toast.error('Question needs at least 5 characters.');
      return;
    }
    if (draft.answer.trim().length < 5) {
      toast.error('Answer needs at least 5 characters.');
      return;
    }
    const payload = {
      question: draft.question.trim(),
      answer: draft.answer.trim(),
      order: Number(draft.order) || 0,
      isActive: draft.isActive,
    };
    try {
      if (editor.faq) {
        await updateFaq({ id: editor.faq._id, body: payload }).unwrap();
        toast.success('FAQ updated');
      } else {
        await createFaq(payload).unwrap();
        toast.success('FAQ created');
      }
      setEditor({ open: false, draft: emptyDraft });
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ?? 'Could not save FAQ'
      );
    }
  };

  const move = async (faq: Faq, direction: -1 | 1) => {
    const index = faqs.findIndex((item) => item._id === faq._id);
    const target = faqs[index + direction];
    if (!target) return;
    try {
      await Promise.all([
        updateFaq({ id: faq._id, body: { order: target.order } }).unwrap(),
        updateFaq({ id: target._id, body: { order: faq.order } }).unwrap(),
      ]);
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ?? 'Could not reorder FAQs'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">
            <CircleHelp className="h-3.5 w-3.5 text-primary" />
            Support content
          </span>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">FAQs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            These answers power the homepage FAQ and the contact page. Order controls display position.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New FAQ
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={RefreshCcw}
          title="FAQs could not load"
          description="The site content service did not respond."
          action={
            <Button onClick={() => refetch()} loading={isFetching}>
              <RefreshCcw className="h-4 w-4" />
              Retry
            </Button>
          }
        />
      ) : faqs.length === 0 ? (
        <EmptyState
          icon={CircleHelp}
          title="No FAQs yet"
          description="Add common questions to reduce support requests and help students decide."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Create FAQ
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <article key={faq._id} className="rounded-2xl border bg-card p-5 shadow-soft">
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex flex-col gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => move(faq, -1)}
                    disabled={index === 0}
                    aria-label="Move FAQ up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => move(faq, 1)}
                    disabled={index === faqs.length - 1}
                    aria-label="Move FAQ down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-bold">{faq.question}</h2>
                    <Badge variant={faq.isActive ? 'success' : 'secondary'}>
                      {faq.isActive ? 'Visible' : 'Hidden'}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">Order {faq.order}</span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {faq.answer}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => openEdit(faq)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setToDelete(faq)}
                    aria-label="Delete FAQ"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={editor.open}
        onClose={() => setEditor({ open: false, draft: emptyDraft })}
        title={editor.faq ? 'Edit FAQ' : 'New FAQ'}
        description="Answers are rendered as paragraphs on the homepage and contact page."
        footer={
          <>
            <Button variant="outline" onClick={() => setEditor({ open: false, draft: emptyDraft })}>
              Cancel
            </Button>
            <Button onClick={save} loading={creating || updating}>
              {editor.faq ? 'Save changes' : 'Create FAQ'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold">Question</label>
            <Input
              value={editor.draft.question}
              onChange={(event) =>
                setEditor((current) => ({
                  ...current,
                  draft: { ...current.draft, question: event.target.value },
                }))
              }
              className="mt-1.5"
              maxLength={300}
              placeholder="e.g. Do I get a certificate?"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-semibold">Answer</label>
            <Textarea
              value={editor.draft.answer}
              onChange={(event) =>
                setEditor((current) => ({
                  ...current,
                  draft: { ...current.draft, answer: event.target.value },
                }))
              }
              className="mt-1.5"
              rows={5}
              maxLength={3000}
              placeholder="A clear, complete answer."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold">Order</label>
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
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 p-3">
              <div>
                <p className="text-sm font-medium">Visible</p>
                <p className="text-[11px] text-muted-foreground">Show on public pages.</p>
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
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await deleteFaq(toDelete._id).unwrap();
            toast.success('FAQ deleted');
            setToDelete(null);
          } catch (error) {
            toast.error(
              (error as { data?: { message?: string } })?.data?.message ?? 'Could not delete FAQ'
            );
          }
        }}
        title="Delete this FAQ?"
        description={`“${toDelete?.question ?? ''}” will be removed from the homepage and contact page.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete FAQ'}
        destructive
      />
    </div>
  );
}
