'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BadgeCheck, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RatingInput, Stars } from '@/components/ui/rating';
import { Textarea } from '@/components/ui/textarea';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useCreateReviewMutation, useGetCourseReviewsQuery } from '@/services/reviewApi';
import { getApiErrorMessage } from '@/utils/api-error';
import { formatDate } from '@/utils/format';

const reviewSchema = z.object({
  rating: z.number().min(1, 'Choose a star rating').max(5),
  comment: z.string().trim().min(3, 'Please write at least a few words').max(2000, 'Review is too long'),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

export function CourseReviews({
  courseId,
  isEnrolled,
}: {
  courseId: string;
  isEnrolled: boolean;
}) {
  const { user } = useAuth();
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useGetCourseReviewsQuery({ courseId, page, limit: 6 });
  const [createReview, { isLoading: submitting }] = useCreateReviewMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: '' },
  });

  const rating = watch('rating');
  const summary = data?.summary;
  const hasReviewed = Boolean(
    user && data?.items.some((review) => review.user?._id === user._id)
  );

  const onSubmit = async (values: ReviewFormValues) => {
    try {
      await createReview({ courseId, rating: values.rating, comment: values.comment }).unwrap();
      toast.success('Thanks for sharing your review!');
      reset({ rating: 0, comment: '' });
      setPage(1);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not submit your review.'));
    }
  };

  return (
    <section id="reviews" className="scroll-mt-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Student reviews</h2>
        {summary?.count ? (
          <div className="flex items-center gap-2">
            <Stars value={summary.average} size="md" />
            <span className="text-sm font-semibold">{summary.average.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">({summary.count})</span>
          </div>
        ) : null}
      </div>

      {summary?.count ? (
        <div className="mt-4 rounded-2xl border bg-card p-5 shadow-soft">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="text-center sm:w-40 sm:border-r">
              <p className="text-4xl font-black">{summary.average.toFixed(1)}</p>
              <Stars value={summary.average} size="md" className="mt-1 justify-center" />
              <p className="mt-1 text-xs text-muted-foreground">{summary.count} reviews</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = summary.breakdown?.[String(star)] ?? 0;
                const percent = summary.count ? Math.round((count / summary.count) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-3 text-xs">
                    <span className="w-8 font-medium text-muted-foreground">{star} star</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="w-8 text-right text-muted-foreground">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="mt-4 h-16 w-full" />
            </div>
          ))
        ) : data?.items.length ? (
          data.items.map((review) => (
            <article key={review._id} className="rounded-xl border bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={review.user?.name} src={review.user?.avatar?.url} size="sm" />
                  <div>
                    <p className="text-sm font-semibold">{review.user?.name}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Stars value={review.rating} size="xs" />
                      <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="success" className="shrink-0">
                  <BadgeCheck className="h-3 w-3" />
                  Verified student
                </Badge>
              </div>
              <p className="mt-3.5 text-sm leading-6 text-muted-foreground">{review.comment}</p>
              {review.adminReply ? (
                <div className="mt-4 rounded-lg border-l-2 border-primary bg-primary/[0.04] p-3.5">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Instructor response
                  </p>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    {review.adminReply.content}
                  </p>
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <EmptyState
            compact
            icon={MessageSquare}
            title="No reviews yet"
            description="Be the first enrolled student to share what you learned."
          />
        )}
      </div>

      {data && data.meta.totalPages > 1 ? (
        <Pagination className="mt-6" page={data.meta.page} totalPages={data.meta.totalPages} onPageChange={setPage} />
      ) : null}

      <div className="mt-8 rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
        <h3 className="text-base font-semibold">Share your experience</h3>
        {!user ? (
          <p className="mt-2 text-sm text-muted-foreground">Sign in as an enrolled student to leave a review.</p>
        ) : !isEnrolled ? (
          <Alert variant="info" className="mt-3">
            Only enrolled students can review this course. Enroll to unlock reviews.
          </Alert>
        ) : hasReviewed ? (
          <Alert variant="success" className="mt-3" title="You already reviewed this course">
            Thank you for your feedback — you can edit your review from your dashboard in a future update.
          </Alert>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div>
              <RatingInput value={rating} onChange={(value) => setValue('rating', value, { shouldValidate: true })} />
              {errors.rating ? <p className="field-error">{errors.rating.message}</p> : null}
            </div>
            <div>
              <Textarea
                placeholder="What did you build? What did you enjoy most?"
                rows={4}
                invalid={Boolean(errors.comment)}
                {...register('comment')}
              />
              {errors.comment ? <p className="field-error">{errors.comment.message}</p> : null}
            </div>
            <Button type="submit" loading={submitting}>
              <Send className="h-4 w-4" />
              Submit review
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
