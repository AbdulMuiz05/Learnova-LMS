'use client';

import * as React from 'react';
import { CheckCircle2, MessageSquare, Send, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAskQuestionMutation, useGetLessonQuestionsQuery } from '@/services/questionApi';
import { getApiErrorMessage } from '@/utils/api-error';
import { timeAgo } from '@/utils/format';

export function LessonQuestions({
  lessonId,
  canAsk,
}: {
  lessonId: string;
  canAsk: boolean;
}) {
  const [page, setPage] = React.useState(1);
  const [content, setContent] = React.useState('');
  const [error, setError] = React.useState('');
  const { data, isLoading } = useGetLessonQuestionsQuery({ lessonId, page });
  const [askQuestion, { isLoading: submitting }] = useAskQuestionMutation();

  React.useEffect(() => {
    setPage(1);
    setContent('');
    setError('');
  }, [lessonId]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (trimmed.length < 5) {
      setError('Write at least 5 characters so instructors can help.');
      return;
    }
    setError('');
    try {
      await askQuestion({ lessonId, content: trimmed }).unwrap();
      setContent('');
      setPage(1);
      toast.success('Question sent to your instructors.');
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, 'Could not post your question.'));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <MessageSquare className="h-5 w-5 text-primary" />
          Lesson Q&amp;A
        </h2>
        <p className="text-xs text-muted-foreground">
          Questions are visible to enrolled students and instructors.
        </p>
      </div>

      {canAsk ? (
        <form onSubmit={submit} className="mt-4 rounded-2xl border bg-card p-4 shadow-soft">
          <label htmlFor="question-content" className="field-label">
            Ask a question about this lesson
          </label>
          <Textarea
            id="question-content"
            rows={3}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="What are you stuck on? Include the error or the step you are on."
            invalid={Boolean(error)}
            maxLength={1000}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className={error ? 'field-error' : 'field-hint'}>
              {error || `${content.length}/1000 characters`}
            </p>
            <Button type="submit" size="sm" loading={submitting} disabled={!content.trim()}>
              <Send className="h-3.5 w-3.5" />
              Post question
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-3 rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
          Sign in with an enrolled account to ask questions. Administrators can answer from the admin
          Questions section.
        </p>
      )}

      <div className="mt-5 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="mt-3 h-10 w-full" />
            </div>
          ))
        ) : data?.items.length ? (
          data.items.map((question) => (
            <article key={question._id} className="rounded-2xl border bg-card p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={question.user?.name} src={question.user?.avatar?.url} size="xs" />
                  <div>
                    <p className="text-sm font-semibold">{question.user?.name}</p>
                    <p className="text-[11px] text-muted-foreground">{timeAgo(question.createdAt)}</p>
                  </div>
                </div>
                {question.isResolved ? (
                  <Badge variant="success">
                    <CheckCircle2 className="h-3 w-3" />
                    Resolved
                  </Badge>
                ) : (
                  <Badge variant="secondary">Open</Badge>
                )}
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-6">{question.content}</p>

              {question.answers.length ? (
                <div className="mt-4 space-y-3 border-l-2 border-primary/20 pl-4">
                  {question.answers.map((answer, index) => (
                    <div key={index} className="rounded-lg bg-muted/40 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Avatar name={answer.user?.name} src={answer.user?.avatar?.url} size="xs" />
                        <span className="text-xs font-semibold">{answer.user?.name}</span>
                        {answer.isAdmin ? (
                          <Badge variant="primary" className="px-2 py-0 text-[10px]">
                            <ShieldCheck className="h-3 w-3" />
                            Instructor
                          </Badge>
                        ) : null}
                        <span className="text-[10px] text-muted-foreground">{timeAgo(answer.createdAt)}</span>
                      </div>
                      <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                        {answer.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">Awaiting an instructor reply.</p>
              )}
            </article>
          ))
        ) : (
          <EmptyState
            compact
            icon={MessageSquare}
            title="No questions on this lesson yet"
            description="Ask the first question and an instructor will reply from the admin console."
          />
        )}
      </div>

      {data && data.meta.totalPages > 1 ? (
        <Pagination className="mt-5" page={data.meta.page} totalPages={data.meta.totalPages} onPageChange={setPage} />
      ) : null}
    </div>
  );
}
