'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageCircleQuestion,
  RefreshCcw,
  Search,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  useAnswerQuestionMutation,
  useGetAdminQuestionsQuery,
  useResolveQuestionMutation,
} from '@/services/questionApi';
import { cn } from '@/utils/cn';
import { timeAgo } from '@/utils/format';

const tabs = [
  { value: '', label: 'All questions' },
  { value: 'unanswered', label: 'Unanswered' },
  { value: 'answered', label: 'Resolved' },
];

export default function AdminQuestionsPage() {
  const [status, setStatus] = React.useState('');
  const [search, setSearch] = React.useState('');
  const deferredSearch = React.useDeferredValue(search);
  const [page, setPage] = React.useState(1);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [drafts, setDrafts] = React.useState<Record<string, string>>({});

  const { data, isLoading, isError, refetch, isFetching } = useGetAdminQuestionsQuery({
    page,
    status: status || undefined,
    search: deferredSearch || undefined,
  });
  const [answerQuestion, { isLoading: answering }] = useAnswerQuestionMutation();
  const [resolveQuestion, { isLoading: resolving }] = useResolveQuestionMutation();

  React.useEffect(() => {
    setPage(1);
  }, [status, deferredSearch]);

  const questions = data?.items ?? [];
  const meta = data?.meta;

  const submitAnswer = async (questionId: string) => {
    const content = (drafts[questionId] ?? '').trim();
    if (content.length < 2) {
      toast.error('Write a reply before sending.');
      return;
    }
    try {
      await answerQuestion({ questionId, content }).unwrap();
      setDrafts((current) => ({ ...current, [questionId]: '' }));
      toast.success('Reply published');
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ?? 'Could not publish reply'
      );
    }
  };

  const toggleResolved = async (questionId: string, isResolved: boolean) => {
    try {
      await resolveQuestion({ questionId, isResolved }).unwrap();
      toast.success(isResolved ? 'Marked as resolved' : 'Question reopened');
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ?? 'Could not update question'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">
            <MessageCircleQuestion className="h-3.5 w-3.5 text-primary" />
            Student support
          </span>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Questions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reply to lesson questions from enrolled students. Replies are published instantly and notify
            the student.
          </p>
        </div>
        {typeof data?.unanswered === 'number' ? (
          <Badge variant={data.unanswered > 0 ? 'warning' : 'success'}>
            {data.unanswered} unanswered
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center">
        <div className="flex rounded-xl border bg-muted/50 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatus(tab.value)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                status === tab.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search question text…"
          icon={<Search className="h-4 w-4" />}
          className="sm:ml-auto sm:max-w-xs"
          aria-label="Search questions"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={RefreshCcw}
          title="Questions could not load"
          description="The Q&A service did not respond."
          action={
            <Button onClick={() => refetch()} loading={isFetching}>
              <RefreshCcw className="h-4 w-4" />
              Retry
            </Button>
          }
        />
      ) : questions.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={status === 'unanswered' ? 'No unanswered questions' : 'No questions here'}
          description={
            status === 'unanswered'
              ? 'Every student question has received a reply. Nice work.'
              : 'Questions asked inside lessons will appear in this queue.'
          }
        />
      ) : (
        <div className="space-y-3">
          {questions.map((question) => {
            const open = expanded === question._id;
            return (
              <article key={question._id} className="rounded-2xl border bg-card shadow-soft">
                <div className="p-5">
                  <div className="flex flex-wrap items-start gap-3">
                    <Avatar name={question.user?.name} src={question.user?.avatar?.url} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{question.user?.name ?? 'Student'}</p>
                        <span className="text-[11px] text-muted-foreground">
                          {timeAgo(question.createdAt)}
                        </span>
                        <Badge variant={question.isResolved ? 'success' : 'warning'}>
                          {question.isResolved ? 'Resolved' : 'Open'}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        <Link
                          href={`/learn/${question.course?._id ?? ''}?lesson=${question.lesson?._id ?? ''}`}
                          target="_blank"
                          className="font-medium text-primary hover:underline"
                        >
                          {question.course?.title}
                        </Link>{' '}
                        · {question.lesson?.title}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{question.content}</p>

                      {question.answers.length ? (
                        <div className="mt-3 space-y-2 rounded-xl border bg-muted/25 p-3">
                          {question.answers.map((answer, index) => (
                            <div key={index} className="flex gap-2.5">
                              <Avatar
                                name={answer.user?.name}
                                src={answer.user?.avatar?.url}
                                size="xs"
                              />
                              <div className="min-w-0">
                                <p className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                                  {answer.user?.name ?? 'Team'}
                                  {answer.isAdmin ? (
                                    <Badge variant="default" className="px-1.5 py-0 text-[9px]">
                                      <BadgeCheck className="h-2.5 w-2.5" />
                                      Instructor
                                    </Badge>
                                  ) : null}
                                  <span className="font-normal text-muted-foreground">
                                    {timeAgo(answer.createdAt)}
                                  </span>
                                </p>
                                <p className="mt-0.5 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                                  {answer.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded(open ? null : question._id)}
                      >
                        {open ? (
                          <>
                            <ChevronUp className="h-3.5 w-3.5" />
                            Hide reply
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3.5 w-3.5" />
                            Reply
                          </>
                        )}
                      </Button>
                      <Button
                        variant={question.isResolved ? 'outline' : 'success'}
                        size="sm"
                        loading={resolving}
                        onClick={() => toggleResolved(question._id, !question.isResolved)}
                      >
                        {question.isResolved ? 'Reopen' : 'Resolve'}
                      </Button>
                    </div>
                  </div>

                  {open ? (
                    <div className="mt-4 rounded-xl border bg-muted/20 p-3">
                      <Textarea
                        value={drafts[question._id] ?? ''}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [question._id]: event.target.value,
                          }))
                        }
                        rows={3}
                        placeholder="Write a clear, helpful answer…"
                        aria-label={`Reply to ${question.user?.name ?? 'student'}`}
                      />
                      <div className="mt-2 flex justify-end">
                        <Button
                          size="sm"
                          loading={answering}
                          onClick={() => submitAnswer(question._id)}
                        >
                          <Send className="h-3.5 w-3.5" />
                          Publish reply
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}

          {meta ? (
            <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
          ) : null}
        </div>
      )}
    </div>
  );
}
