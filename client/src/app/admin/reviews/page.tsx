'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  MessageSquareReply,
  RefreshCcw,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Stars } from '@/components/ui/rating';
import { Textarea } from '@/components/ui/textarea';
import {
  useDeleteReviewMutation,
  useGetAdminReviewsQuery,
  useReplyToReviewMutation,
} from '@/services/reviewApi';
import type { Review } from '@/types';
import { timeAgo } from '@/utils/format';

export default function AdminReviewsPage() {
  const [search, setSearch] = React.useState('');
  const deferredSearch = React.useDeferredValue(search);
  const [rating, setRating] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [replyTo, setReplyTo] = React.useState<Review | null>(null);
  const [replyText, setReplyText] = React.useState('');
  const [toDelete, setToDelete] = React.useState<Review | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useGetAdminReviewsQuery({
    page,
    limit: 15,
    search: deferredSearch || undefined,
    rating: rating || undefined,
  });
  const [replyToReview, { isLoading: replying }] = useReplyToReviewMutation();
  const [deleteReview, { isLoading: deleting }] = useDeleteReviewMutation();

  React.useEffect(() => {
    setPage(1);
  }, [deferredSearch, rating]);

  const reviews = data?.items ?? [];
  const meta = data?.meta;

  const openReply = (review: Review) => {
    setReplyTo(review);
    setReplyText(review.adminReply?.content ?? '');
  };

  const sendReply = async () => {
    if (!replyTo) return;
    if (replyText.trim().length < 2) {
      toast.error('Write a reply before publishing.');
      return;
    }
    try {
      await replyToReview({ reviewId: replyTo._id, content: replyText.trim() }).unwrap();
      toast.success('Reply published');
      setReplyTo(null);
      setReplyText('');
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ?? 'Could not publish reply'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">
            <Star className="h-3.5 w-3.5 text-primary" />
            Social proof
          </span>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Reviews</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Moderate course ratings and publish official replies. Replies appear beneath the review on
            the course page.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search review text…"
          icon={<Search className="h-4 w-4" />}
          className="sm:max-w-sm"
          aria-label="Search reviews"
        />
        <Select
          value={rating}
          onChange={(event) => setRating(event.target.value)}
          aria-label="Filter by rating"
          className="sm:w-40"
        >
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} star{value === 1 ? '' : 's'}
            </option>
          ))}
        </Select>
        {meta ? (
          <span className="text-xs text-muted-foreground sm:ml-auto">
            {meta.total} review{meta.total === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={RefreshCcw}
          title="Reviews could not load"
          description="The review service did not respond."
          action={
            <Button onClick={() => refetch()} loading={isFetching}>
              <RefreshCcw className="h-4 w-4" />
              Retry
            </Button>
          }
        />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No reviews found"
          description="Students can rate a course after enrolling. New reviews show up here."
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <article key={review._id} className="rounded-2xl border bg-card p-5 shadow-soft">
              <div className="flex flex-wrap items-start gap-3">
                <Avatar name={review.user?.name} src={review.user?.avatar?.url} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{review.user?.name ?? 'Student'}</p>
                    <Stars value={review.rating} />
                    <span className="text-[11px] text-muted-foreground">
                      {timeAgo(review.createdAt)}
                    </span>
                  </div>
                  <Link
                    href={`/courses/${review.course?.slug ?? ''}`}
                    target="_blank"
                    className="mt-0.5 inline-block text-[11px] font-medium text-primary hover:underline"
                  >
                    {review.course?.title}
                  </Link>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {review.comment}
                  </p>

                  {review.adminReply ? (
                    <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
                        Your reply
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
                        {review.adminReply.content}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {timeAgo(review.adminReply.repliedAt)}
                      </p>
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  <Badge variant={review.rating >= 4 ? 'success' : review.rating >= 3 ? 'warning' : 'destructive'}>
                    {review.rating}/5
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => openReply(review)}>
                    <MessageSquareReply className="h-3.5 w-3.5" />
                    {review.adminReply ? 'Edit reply' : 'Reply'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setToDelete(review)}
                    aria-label="Delete review"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </article>
          ))}

          {meta ? (
            <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
          ) : null}
        </div>
      )}

      <Modal
        open={Boolean(replyTo)}
        onClose={() => setReplyTo(null)}
        title="Reply to review"
        description={
          replyTo
            ? `Replying to ${replyTo.user?.name ?? 'a student'} on “${replyTo.course?.title ?? ''}”.`
            : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setReplyTo(null)}>
              Cancel
            </Button>
            <Button onClick={sendReply} loading={replying}>
              Publish reply
            </Button>
          </>
        }
      >
        <Textarea
          value={replyText}
          onChange={(event) => setReplyText(event.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="Thank the student and address their feedback…"
        />
        <p className="mt-2 text-[11px] text-muted-foreground">
          This reply is public and attributed to the Learnova team.
        </p>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await deleteReview(toDelete._id).unwrap();
            toast.success('Review deleted');
            setToDelete(null);
          } catch (error) {
            toast.error(
              (error as { data?: { message?: string } })?.data?.message ?? 'Could not delete review'
            );
          }
        }}
        title="Delete this review?"
        description="The review and any admin reply will be permanently removed and the course rating recalculated."
        confirmLabel={deleting ? 'Deleting…' : 'Delete review'}
        destructive
      />
    </div>
  );
}
