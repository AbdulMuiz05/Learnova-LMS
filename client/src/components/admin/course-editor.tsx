'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  GripVertical,
  ImagePlus,
  Layers,
  Link2,
  Loader2,
  Lock,
  Pencil,
  PlayCircle,
  Plus,
  Save,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { VideoUploader } from '@/components/admin/video-uploader';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useGetCategoriesQuery } from '@/services/categoryApi';
import {
  useCreateCourseMutation,
  useCreateLessonMutation,
  useCreateSectionMutation,
  useDeleteCourseMutation,
  useDeleteLessonMutation,
  useDeleteSectionMutation,
  useGetAdminCurriculumQuery,
  useReorderLessonsMutation,
  useReorderSectionsMutation,
  useUpdateCourseMutation,
  useUpdateLessonMutation,
  useUpdateSectionMutation,
} from '@/services/courseApi';
import { useUploadImageMutation } from '@/services/uploadApi';
import type { Course, Lesson, LessonResource, LessonVideo, Section } from '@/types';
import { cn } from '@/utils/cn';
import { formatCurrency, formatDuration, formatNumber } from '@/utils/format';

const courseFormSchema = z
  .object({
    title: z.string().trim().min(4, 'Title needs at least 4 characters').max(160, 'Title is too long'),
    shortDescription: z
      .string()
      .trim()
      .min(10, 'Short description needs at least 10 characters')
      .max(400, 'Short description must be 400 characters or fewer'),
    description: z
      .string()
      .trim()
      .min(20, 'Description needs at least 20 characters')
      .max(20000, 'Description is too long'),
    category: z.string().min(1, 'Choose a category'),
    level: z.enum(['beginner', 'intermediate', 'advanced']),
    price: z
      .string()
      .trim()
      .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid price (e.g. 49.99)'),
    discountPrice: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || /^\d+(\.\d{1,2})?$/.test(value), 'Enter a valid discount price'),
    language: z.string().trim().max(40).optional(),
    status: z.enum(['draft', 'published']),
    featured: z.boolean(),
    benefits: z.array(z.object({ value: z.string().trim().max(200) })).max(20),
    requirements: z.array(z.object({ value: z.string().trim().max(200) })).max(20),
    instructor: z.object({
      name: z.string().trim().max(120),
      title: z.string().trim().max(120),
      bio: z.string().trim().max(1000),
      avatar: z.string().trim().max(1000),
    }),
    thumbnailUrl: z.string().trim().max(2000).optional(),
  })
  .refine(
    (values) =>
      !values.discountPrice ||
      Number(values.discountPrice) < Number(values.price) ||
      Number(values.discountPrice) === 0,
    { path: ['discountPrice'], message: 'Discount must be lower than the price' }
  );

type CourseFormValues = z.infer<typeof courseFormSchema>;

const emptyValues: CourseFormValues = {
  title: '',
  shortDescription: '',
  description: '',
  category: '',
  level: 'beginner',
  price: '0',
  discountPrice: '',
  language: 'English',
  status: 'draft',
  featured: false,
  benefits: [{ value: '' }],
  requirements: [{ value: '' }],
  instructor: { name: '', title: '', bio: '', avatar: '' },
  thumbnailUrl: '',
};

function toFormValues(course: Course): CourseFormValues {
  return {
    title: course.title,
    shortDescription: course.shortDescription,
    description: course.description,
    category: course.category?._id ?? '',
    level: course.level,
    price: String(course.price ?? 0),
    discountPrice: course.discountPrice ? String(course.discountPrice) : '',
    language: course.language || 'English',
    status: course.status,
    featured: course.featured,
    benefits: course.benefits?.length
      ? course.benefits.map((value) => ({ value }))
      : [{ value: '' }],
    requirements: course.requirements?.length
      ? course.requirements.map((value) => ({ value }))
      : [{ value: '' }],
    instructor: {
      name: course.instructor?.name ?? '',
      title: course.instructor?.title ?? '',
      bio: course.instructor?.bio ?? '',
      avatar: course.instructor?.avatar ?? '',
    },
    thumbnailUrl: '',
  };
}

export function CourseEditor({ courseId }: { courseId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(courseId);
  const {
    data: curriculumData,
    isLoading: curriculumLoading,
    isError: curriculumError,
    refetch: refetchCurriculum,
    isFetching: curriculumFetching,
  } = useGetAdminCurriculumQuery(courseId ?? '', { skip: !courseId });
  const course = curriculumData?.course;
  const curriculum = curriculumData?.curriculum ?? [];

  const { data: categoriesData } = useGetCategoriesQuery();
  const categories = categoriesData?.categories ?? [];

  const [createCourse, { isLoading: creating }] = useCreateCourseMutation();
  const [updateCourse, { isLoading: updating }] = useUpdateCourseMutation();
  const [deleteCourse, { isLoading: deletingCourse }] = useDeleteCourseMutation();
  const [uploadImage, { isLoading: uploadingImage }] = useUploadImageMutation();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [thumbnail, setThumbnail] = React.useState<{ url: string; publicId: string } | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [fieldError, setFieldError] = React.useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: emptyValues,
  });

  const benefitsArray = useFieldArray({ control, name: 'benefits' });
  const requirementsArray = useFieldArray({ control, name: 'requirements' });
  const status = watch('status');
  const price = watch('price');
  const discountPrice = watch('discountPrice');

  React.useEffect(() => {
    if (course) {
      reset(toFormValues(course));
      setThumbnail(
        course.thumbnail?.url
          ? { url: course.thumbnail.url, publicId: course.thumbnail.publicId ?? '' }
          : null
      );
    }
  }, [course, reset]);

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Choose a JPG, PNG, WebP or GIF image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Thumbnails must be smaller than 5 MB.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', 'courses');
      const uploaded = await uploadImage({ formData }).unwrap();
      setThumbnail({ url: uploaded.url, publicId: uploaded.publicId });
      toast.success('Thumbnail uploaded');
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ??
          'Image upload failed. Add Cloudinary credentials or paste an image URL instead.'
      );
    }
  };

  const onSubmit = async (values: CourseFormValues) => {
    setFieldError(null);
    const customThumbnailUrl = values.thumbnailUrl?.trim();
    const thumbnailPayload = thumbnail?.url
      ? thumbnail
      : customThumbnailUrl
        ? { url: customThumbnailUrl, publicId: '' }
        : undefined;

    const payload = {
      title: values.title.trim(),
      shortDescription: values.shortDescription.trim(),
      description: values.description.trim(),
      category: values.category,
      level: values.level,
      price: Number(values.price),
      discountPrice: values.discountPrice ? Number(values.discountPrice) : null,
      language: values.language?.trim() || 'English',
      status: values.status,
      featured: values.featured,
      benefits: values.benefits.map((item) => item.value.trim()).filter(Boolean),
      requirements: values.requirements.map((item) => item.value.trim()).filter(Boolean),
      instructor: {
        name: values.instructor.name.trim() || 'Learnova Instructor',
        title: values.instructor.title.trim() || 'Senior Engineer',
        bio: values.instructor.bio.trim(),
        avatar: values.instructor.avatar.trim(),
      },
      ...(thumbnailPayload ? { thumbnail: thumbnailPayload } : {}),
    };

    try {
      if (isEdit && courseId) {
        await updateCourse({ id: courseId, body: payload }).unwrap();
        toast.success('Course saved');
        await refetchCurriculum();
      } else {
        const created = await createCourse(payload).unwrap();
        toast.success('Course created — now build the curriculum');
        router.replace(`/admin/courses/${created.course._id}`);
      }
    } catch (error) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ?? 'Could not save this course';
      setFieldError(message);
      toast.error(message);
    }
  };

  if (isEdit && curriculumLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  if (isEdit && (curriculumError || !course)) {
    return (
      <EmptyState
        icon={Layers}
        title="Course could not load"
        description="The course editor could not fetch this course. Check the API and retry."
        action={
          <div className="flex gap-2">
            <Button onClick={() => refetchCurriculum()} loading={curriculumFetching}>
              Retry
            </Button>
            <Link href="/admin/courses" className={buttonVariants({ variant: 'outline' })}>
              Back to courses
            </Link>
          </div>
        }
      />
    );
  }

  const lessonCount = curriculum.reduce((total, section) => total + section.lessons.length, 0);
  const saving = creating || updating;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All courses
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-bold">
              {isEdit ? course?.title : 'Create a new course'}
            </h1>
            {isEdit && course ? (
              <Badge variant={course.status === 'published' ? 'success' : 'warning'}>
                {course.status === 'published' ? 'Published' : 'Draft'}
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEdit
              ? `${formatNumber(course?.enrollmentCount ?? 0)} students · ${formatNumber(lessonCount)} lessons · ${formatCurrency(course?.effectivePrice ?? 0)}`
              : 'Set the fundamentals first, then add sections and lessons.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isEdit && course?.status === 'published' ? (
            <Link
              href={`/courses/${course.slug}`}
              target="_blank"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <Eye className="h-4 w-4" />
              View page
            </Link>
          ) : null}
          {isEdit ? (
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4 text-destructive" />
              Delete
            </Button>
          ) : null}
          <Button type="submit" form="course-form" loading={saving} size="sm">
            <Save className="h-4 w-4" />
            {isEdit ? 'Save changes' : 'Create course'}
          </Button>
        </div>
      </div>

      {isEdit && isDirty ? (
        <p className="rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-300">
          You have unsaved course details. Use “Save changes” before leaving this page.
        </p>
      ) : null}

      <form id="course-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
            <h2 className="text-base font-bold">Course details</h2>
            <p className="text-xs text-muted-foreground">What students see in the catalog and on the course page.</p>

            <div className="mt-5 space-y-4">
              <Field label="Title" error={errors.title?.message}>
                <Input {...register('title')} placeholder="e.g. Full-Stack TypeScript Engineering" invalid={Boolean(errors.title)} />
              </Field>
              <Field label="Short description" error={errors.shortDescription?.message} hint="Appears on course cards.">
                <Textarea
                  {...register('shortDescription')}
                  rows={2}
                  maxLength={400}
                  placeholder="A concise promise of what students will learn."
                  invalid={Boolean(errors.shortDescription)}
                />
              </Field>
              <Field label="Full description" error={errors.description?.message}>
                <Textarea
                  {...register('description')}
                  rows={7}
                  placeholder="Describe the course, who it is for and the outcomes."
                  invalid={Boolean(errors.description)}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category" error={errors.category?.message}>
                  <Select {...register('category')} invalid={Boolean(errors.category)}>
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Level" error={errors.level?.message}>
                  <Select {...register('level')}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </Select>
                </Field>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
            <h2 className="text-base font-bold">Pricing & language</h2>
            <p className="text-xs text-muted-foreground">Set 0 for a free course. Discount must be lower than the price.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <Field label="Price (USD)" error={errors.price?.message}>
                <Input {...register('price')} inputMode="decimal" invalid={Boolean(errors.price)} />
              </Field>
              <Field label="Discount price" error={errors.discountPrice?.message} hint="Optional">
                <Input {...register('discountPrice')} inputMode="decimal" placeholder="e.g. 39.99" invalid={Boolean(errors.discountPrice)} />
              </Field>
              <Field label="Language" error={errors.language?.message}>
                <Input {...register('language')} placeholder="English" />
              </Field>
            </div>
            {Number(price) > 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Students pay{' '}
                <span className="font-semibold text-foreground">
                  {formatCurrency(
                    discountPrice && Number(discountPrice) > 0 && Number(discountPrice) < Number(price)
                      ? Number(discountPrice)
                      : Number(price)
                  )}
                </span>
                {discountPrice ? ` (list ${formatCurrency(Number(price))})` : ''}.
              </p>
            ) : (
              <p className="mt-3 text-xs text-success">This course will be free to enroll.</p>
            )}
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
            <h2 className="text-base font-bold">Outcomes & requirements</h2>
            <p className="text-xs text-muted-foreground">Shown as bullet lists on the course page.</p>

            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  What students will learn
                </p>
                <div className="space-y-2">
                  {benefitsArray.fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <Input
                        {...register(`benefits.${index}.value`)}
                        placeholder={`Benefit ${index + 1}`}
                        aria-label={`Benefit ${index + 1}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => benefitsArray.remove(index)}
                        aria-label="Remove benefit"
                        disabled={benefitsArray.fields.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => benefitsArray.append({ value: '' })}
                    disabled={benefitsArray.fields.length >= 20}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add benefit
                  </Button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Requirements
                </p>
                <div className="space-y-2">
                  {requirementsArray.fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <Input
                        {...register(`requirements.${index}.value`)}
                        placeholder={`Requirement ${index + 1}`}
                        aria-label={`Requirement ${index + 1}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => requirementsArray.remove(index)}
                        aria-label="Remove requirement"
                        disabled={requirementsArray.fields.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => requirementsArray.append({ value: '' })}
                    disabled={requirementsArray.fields.length >= 20}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add requirement
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
            <h2 className="text-base font-bold">Instructor</h2>
            <p className="text-xs text-muted-foreground">Displayed on the course detail page.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Name" error={errors.instructor?.name?.message}>
                <Input {...register('instructor.name')} placeholder="Learnova Instructor" />
              </Field>
              <Field label="Role / title" error={errors.instructor?.title?.message}>
                <Input {...register('instructor.title')} placeholder="Staff Engineer" />
              </Field>
            </div>
            <Field label="Bio" error={errors.instructor?.bio?.message} className="mt-4">
              <Textarea {...register('instructor.bio')} rows={3} placeholder="Short instructor biography." />
            </Field>
            <Field
              label="Avatar URL"
              error={errors.instructor?.avatar?.message}
              className="mt-4"
              hint="Paste a public image URL."
            >
              <Input {...register('instructor.avatar')} placeholder="https://…" />
            </Field>
          </section>

          {isEdit && courseId ? (
            <CurriculumBuilder
              courseId={courseId}
              curriculum={curriculum}
              unassigned={curriculumData?.unassignedLessons ?? []}
            />
          ) : (
            <section className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center">
              <Layers className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-semibold">Curriculum comes next</p>
              <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
                Create the course first. You will then be able to add sections, upload protected videos and
                define preview lessons.
              </p>
            </section>
          )}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-2xl border bg-card p-5 shadow-soft">
            <h2 className="text-sm font-bold">Thumbnail</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">16:9 recommended · max 5 MB.</p>
            <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-xl border bg-muted">
              {thumbnail?.url ? (
                <Image
                  src={thumbnail.url}
                  alt="Course thumbnail preview"
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1 text-muted-foreground">
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-[11px]">No thumbnail yet</span>
                </div>
              )}
              {uploadingImage ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              ) : null}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleImageFile(file);
              }}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                loading={uploadingImage}
              >
                <UploadCloud className="h-4 w-4" />
                Upload
              </Button>
              {thumbnail?.url ? (
                <Button variant="ghost" size="sm" onClick={() => setThumbnail(null)}>
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              ) : null}
            </div>
            <Field label="Or paste an image URL" className="mt-4" error={errors.thumbnailUrl?.message}>
              <Input {...register('thumbnailUrl')} placeholder="https://…" />
            </Field>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-soft">
            <h2 className="text-sm font-bold">Publishing</h2>
            <div className="mt-3 space-y-4">
              <Field label="Status" error={errors.status?.message}>
                <Select {...register('status')}>
                  <option value="draft">Draft — hidden from catalog</option>
                  <option value="published">Published — visible to everyone</option>
                </Select>
              </Field>
              <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 p-3">
                <div>
                  <p className="text-sm font-medium">Featured course</p>
                  <p className="text-[11px] text-muted-foreground">Surface on the homepage.</p>
                </div>
                <Controller
                  control={control}
                  name="featured"
                  render={({ field }) => (
                    <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
              {status === 'published' && lessonCount === 0 ? (
                <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-300">
                  This course has no lessons yet. Add curriculum before students can learn.
                </p>
              ) : null}
              <p className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                Video URLs are only issued through the protected lesson endpoint.
              </p>
            </div>
          </section>

          {fieldError ? (
            <p className="rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-xs text-destructive">
              {fieldError}
            </p>
          ) : null}
        </aside>
      </form>

      {isEdit ? (
        <ConfirmDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={async () => {
            if (!courseId) return;
            try {
              await deleteCourse(courseId).unwrap();
              toast.success('Course deleted');
              router.replace('/admin/courses');
            } catch (error) {
              toast.error(
                (error as { data?: { message?: string } })?.data?.message ?? 'Could not delete course'
              );
            }
          }}
          title="Delete this course?"
          description={`“${course?.title ?? ''}” and all sections and lessons will be removed. Order history is preserved.`}
          confirmLabel={deletingCourse ? 'Deleting…' : 'Delete course'}
          destructive
        />
      ) : null}
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-xs font-semibold">{label}</label>
        {hint ? <span className="text-[10px] text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
      {error ? <p className="mt-1 text-[11px] font-medium text-destructive">{error}</p> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Curriculum builder                            */
/* -------------------------------------------------------------------------- */

interface LessonDraft {
  title: string;
  description: string;
  section: string;
  durationMinutes: string;
  isPreview: boolean;
  videoMode: 'cloudinary' | 'external';
  cloudinaryVideo: LessonVideo | null;
  externalUrl: string;
  resources: LessonResource[];
}

function CurriculumBuilder({
  courseId,
  curriculum,
  unassigned,
}: {
  courseId: string;
  curriculum: Section[];
  unassigned: Lesson[];
}) {
  const [createSection, { isLoading: creatingSection }] = useCreateSectionMutation();
  const [updateSection] = useUpdateSectionMutation();
  const [deleteSectionMutation, { isLoading: deletingSection }] = useDeleteSectionMutation();
  const [reorderSections] = useReorderSectionsMutation();
  const [reorderLessons] = useReorderLessonsMutation();
  const [createLesson, { isLoading: creatingLesson }] = useCreateLessonMutation();
  const [updateLesson, { isLoading: updatingLesson }] = useUpdateLessonMutation();
  const [deleteLessonMutation, { isLoading: deletingLesson }] = useDeleteLessonMutation();

  const [sectionModal, setSectionModal] = React.useState<{
    open: boolean;
    mode: 'create' | 'rename';
    section?: Section;
    title: string;
  }>({ open: false, mode: 'create', title: '' });
  const [sectionToDelete, setSectionToDelete] = React.useState<Section | null>(null);
  const [lessonToDelete, setLessonToDelete] = React.useState<Lesson | null>(null);
  const [lessonModal, setLessonModal] = React.useState<{
    open: boolean;
    mode: 'create' | 'edit';
    sectionId: string;
    lesson?: Lesson;
    draft: LessonDraft;
    saving: boolean;
  }>({
    open: false,
    mode: 'create',
    sectionId: '',
    draft: emptyLessonDraft(''),
    saving: false,
  });

  const totalLessons = curriculum.reduce((total, section) => total + section.lessons.length, 0);

  const saveSection = async () => {
    const title = sectionModal.title.trim();
    if (title.length < 2) {
      toast.error('Section title needs at least 2 characters.');
      return;
    }
    try {
      if (sectionModal.mode === 'create') {
        await createSection({ courseId, title }).unwrap();
        toast.success('Section added');
      } else if (sectionModal.section) {
        await updateSection({ sectionId: sectionModal.section._id, courseId, title }).unwrap();
        toast.success('Section renamed');
      }
      setSectionModal({ open: false, mode: 'create', title: '' });
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ?? 'Could not save section'
      );
    }
  };

  const moveSection = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= curriculum.length) return;
    const ids = curriculum.map((section) => section._id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    try {
      await reorderSections({ courseId, orderedIds: ids }).unwrap();
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ?? 'Could not reorder sections'
      );
    }
  };

  const moveLesson = async (section: Section, index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= section.lessons.length) return;
    const flat = curriculum.flatMap((item) => item.lessons);
    const lesson = section.lessons[index];
    const swapWith = section.lessons[target];
    const first = flat.findIndex((item) => item._id === lesson._id);
    const second = flat.findIndex((item) => item._id === swapWith._id);
    if (first < 0 || second < 0) return;
    [flat[first], flat[second]] = [flat[second], flat[first]];
    try {
      await reorderLessons({ courseId, orderedIds: flat.map((item) => item._id) }).unwrap();
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ?? 'Could not reorder lessons'
      );
    }
  };

  const openCreateLesson = (sectionId: string) => {
    setLessonModal({
      open: true,
      mode: 'create',
      sectionId,
      draft: emptyLessonDraft(sectionId),
      saving: false,
    });
  };

  const openEditLesson = (sectionId: string, lesson: Lesson) => {
    setLessonModal({
      open: true,
      mode: 'edit',
      sectionId,
      lesson,
      draft: {
        title: lesson.title,
        description: lesson.description ?? '',
        section: lesson.section ?? sectionId,
        durationMinutes: lesson.duration ? String(Math.round((lesson.duration / 60) * 10) / 10) : '',
        isPreview: lesson.isPreview,
        videoMode: lesson.video?.provider === 'external' ? 'external' : 'cloudinary',
        cloudinaryVideo:
          lesson.video?.provider === 'cloudinary'
            ? lesson.video
            : lesson.video?.publicId
              ? lesson.video
              : null,
        externalUrl: lesson.video?.provider === 'external' ? lesson.video.url ?? '' : '',
        resources: lesson.resources?.length ? lesson.resources : [],
      },
      saving: false,
    });
  };

  const saveLesson = async () => {
    const draft = lessonModal.draft;
    if (draft.title.trim().length < 2) {
      toast.error('Lesson title needs at least 2 characters.');
      return;
    }

    const badResource = draft.resources.find((resource) => {
      if (!resource.title.trim() || !resource.url.trim()) return true;
      try {
        new URL(resource.url.trim());
        return false;
      } catch {
        return true;
      }
    });
    if (badResource) {
      toast.error('Every resource needs a title and a valid full URL.');
      return;
    }

    let duration = 0;
    if (draft.durationMinutes.trim()) {
      const minutes = Number(draft.durationMinutes);
      if (!Number.isFinite(minutes) || minutes < 0) {
        toast.error('Duration must be a positive number of minutes.');
        return;
      }
      duration = Math.round(minutes * 60);
    } else if (draft.videoMode === 'cloudinary' && draft.cloudinaryVideo?.duration) {
      duration = draft.cloudinaryVideo.duration;
    } else if (lessonModal.lesson) {
      duration = lessonModal.lesson.duration;
    }

    let video: LessonVideo;
    if (draft.videoMode === 'external') {
      if (!draft.externalUrl.trim()) {
        toast.error('Add an external video URL or switch to Cloudinary upload.');
        return;
      }
      try {
        new URL(draft.externalUrl.trim());
      } catch {
        toast.error('The external video URL is not valid.');
        return;
      }
      video = {
        provider: 'external',
        type: 'upload',
        url: draft.externalUrl.trim(),
        publicId: '',
        duration,
      };
    } else {
      video = draft.cloudinaryVideo
        ? { ...draft.cloudinaryVideo, duration: draft.cloudinaryVideo.duration || duration }
        : { provider: 'cloudinary', type: 'authenticated', url: '', publicId: '', duration };
      if (!video.publicId) {
        toast.error('Upload a video to Cloudinary or use an external URL.');
        return;
      }
    }

    const sectionValue = draft.section || lessonModal.sectionId;
    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      ...(sectionValue ? { section: sectionValue } : {}),
      duration,
      resources: draft.resources
        .map((resource) => ({ title: resource.title.trim(), url: resource.url.trim() }))
        .filter((resource) => resource.title && resource.url),
      isPreview: draft.isPreview,
      video,
    };

    setLessonModal((current) => ({ ...current, saving: true }));
    try {
      if (lessonModal.mode === 'edit' && lessonModal.lesson) {
        await updateLesson({
          lessonId: lessonModal.lesson._id,
          courseId,
          body: payload,
        }).unwrap();
        toast.success('Lesson updated');
      } else {
        await createLesson({
          sectionId: lessonModal.sectionId,
          courseId,
          body: payload,
        }).unwrap();
        toast.success('Lesson added');
      }
      setLessonModal((current) => ({ ...current, open: false, saving: false }));
    } catch (error) {
      setLessonModal((current) => ({ ...current, saving: false }));
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ?? 'Could not save lesson'
      );
    }
  };

  return (
    <section className="rounded-2xl border bg-card shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold">
            <Layers className="h-4 w-4 text-primary" />
            Curriculum
          </h2>
          <p className="text-xs text-muted-foreground">
            {curriculum.length} sections · {totalLessons} lessons · students see this exact order
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setSectionModal({ open: true, mode: 'create', title: '' })}
        >
          <Plus className="h-4 w-4" />
          Add section
        </Button>
      </div>

      {curriculum.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={Layers}
            title="No sections yet"
            description="Add your first section, then fill it with lessons. Preview lessons can be watched before enrolling."
            action={
              <Button onClick={() => setSectionModal({ open: true, mode: 'create', title: '' })}>
                <Plus className="h-4 w-4" />
                Add first section
              </Button>
            }
            compact
            className="border-0"
          />
        </div>
      ) : (
        <div className="divide-y">
          {curriculum.map((section, sectionIndex) => (
            <div key={section._id}>
              <div className="flex flex-wrap items-center gap-2 bg-muted/30 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => moveSection(sectionIndex, -1)}
                    disabled={sectionIndex === 0}
                    aria-label="Move section up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => moveSection(sectionIndex, 1)}
                    disabled={sectionIndex === curriculum.length - 1}
                    aria-label="Move section down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {sectionIndex + 1}. {section.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {section.lessons.length} lesson{section.lessons.length === 1 ? '' : 's'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    setSectionModal({ open: true, mode: 'rename', section, title: section.title })
                  }
                  aria-label="Rename section"
                  title="Rename section"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSectionToDelete(section)}
                  aria-label="Delete section"
                  title="Delete section"
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => openCreateLesson(section._id)}>
                  <Plus className="h-3.5 w-3.5" />
                  Lesson
                </Button>
              </div>

              {section.lessons.length === 0 ? (
                <p className="px-5 py-5 text-center text-xs text-muted-foreground">
                  This section has no lessons yet. Add one to make it count toward course progress.
                </p>
              ) : (
                <ul className="divide-y">
                  {section.lessons.map((lesson, lessonIndex) => (
                    <li key={lesson._id} className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5">
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => moveLesson(section, lessonIndex, -1)}
                          disabled={lessonIndex === 0}
                          aria-label="Move lesson up"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => moveLesson(section, lessonIndex, 1)}
                          disabled={lessonIndex === section.lessons.length - 1}
                          aria-label="Move lesson down"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <span className="hidden text-muted-foreground sm:block">
                        <GripVertical className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {lessonIndex + 1}. {lesson.title}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{lesson.duration ? formatDuration(lesson.duration) : 'No duration'}</span>
                          {lesson.video?.publicId || lesson.video?.url ? (
                            <span className="inline-flex items-center gap-1 text-success">
                              <PlayCircle className="h-3 w-3" />
                              Video ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600">
                              <FileText className="h-3 w-3" />
                              No video
                            </span>
                          )}
                          {lesson.isPreview ? <Badge variant="success">Free preview</Badge> : null}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditLesson(section._id, lesson)}
                        aria-label="Edit lesson"
                        title="Edit lesson"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setLessonToDelete(lesson)}
                        aria-label="Delete lesson"
                        title="Delete lesson"
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {unassigned.length ? (
        <div className="border-t bg-amber-500/5 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            Unassigned lessons
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            These lessons are not inside a section. Edit one to move it into a section.
          </p>
          <ul className="mt-2 space-y-1.5">
            {unassigned.map((lesson) => (
              <li key={lesson._id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{lesson.title}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditLesson('', lesson)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Assign
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Section create / rename modal */}
      <Modal
        open={sectionModal.open}
        onClose={() => setSectionModal({ open: false, mode: 'create', title: '' })}
        title={sectionModal.mode === 'create' ? 'Add a section' : 'Rename section'}
        description="Sections group lessons in the order students learn them."
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setSectionModal({ open: false, mode: 'create', title: '' })}
            >
              Cancel
            </Button>
            <Button onClick={saveSection} loading={creatingSection}>
              {sectionModal.mode === 'create' ? 'Add section' : 'Save name'}
            </Button>
          </>
        }
      >
        <label className="text-xs font-semibold">Section title</label>
        <Input
          value={sectionModal.title}
          onChange={(event) =>
            setSectionModal((current) => ({ ...current, title: event.target.value }))
          }
          className="mt-1.5"
          placeholder="e.g. Foundations"
          autoFocus
        />
      </Modal>

      {/* Lesson editor modal */}
      <Modal
        open={lessonModal.open}
        onClose={() => setLessonModal((current) => ({ ...current, open: false }))}
        title={lessonModal.mode === 'create' ? 'Add lesson' : 'Edit lesson'}
        description="Videos are protected; only enrolled students or admins receive signed playback URLs."
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setLessonModal((current) => ({ ...current, open: false }))}
            >
              Cancel
            </Button>
            <Button
              onClick={saveLesson}
              loading={lessonModal.saving || creatingLesson || updatingLesson}
            >
              <Save className="h-4 w-4" />
              {lessonModal.mode === 'create' ? 'Add lesson' : 'Save lesson'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title" error={undefined}>
            <Input
              value={lessonModal.draft.title}
              onChange={(event) =>
                setLessonModal((current) => ({
                  ...current,
                  draft: { ...current.draft, title: event.target.value },
                }))
              }
              placeholder="e.g. Setting up your environment"
              autoFocus
            />
          </Field>

          <Field label="Description">
            <Textarea
              value={lessonModal.draft.description}
              onChange={(event) =>
                setLessonModal((current) => ({
                  ...current,
                  draft: { ...current.draft, description: event.target.value },
                }))
              }
              rows={3}
              placeholder="What this lesson covers."
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Section">
              <Select
                value={lessonModal.draft.section}
                onChange={(event) =>
                  setLessonModal((current) => ({
                    ...current,
                    draft: { ...current.draft, section: event.target.value },
                  }))
                }
              >
                <option value="">No section</option>
                {curriculum.map((section) => (
                  <option key={section._id} value={section._id}>
                    {section.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Duration (minutes)" hint="Optional if the video reports it">
              <Input
                value={lessonModal.draft.durationMinutes}
                onChange={(event) =>
                  setLessonModal((current) => ({
                    ...current,
                    draft: { ...current.draft, durationMinutes: event.target.value },
                  }))
                }
                inputMode="decimal"
                placeholder="e.g. 12"
              />
            </Field>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 p-3">
            <div>
              <p className="text-sm font-medium">Free preview</p>
              <p className="text-[11px] text-muted-foreground">
                Signed-in visitors can watch this lesson before enrolling.
              </p>
            </div>
            <Switch
              checked={lessonModal.draft.isPreview}
              onCheckedChange={(checked) =>
                setLessonModal((current) => ({
                  ...current,
                  draft: { ...current.draft, isPreview: checked },
                }))
              }
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold">Video source</p>
            <div className="flex rounded-xl border bg-muted/50 p-1">
              {(
                [
                  { value: 'cloudinary', label: 'Cloudinary upload' },
                  { value: 'external', label: 'External URL' },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setLessonModal((current) => ({
                      ...current,
                      draft: { ...current.draft, videoMode: option.value },
                    }))
                  }
                  className={cn(
                    'flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                    lessonModal.draft.videoMode === option.value
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mt-3">
              {lessonModal.draft.videoMode === 'cloudinary' ? (
                <VideoUploader
                  value={lessonModal.draft.cloudinaryVideo}
                  onChange={(video) =>
                    setLessonModal((current) => ({
                      ...current,
                      draft: { ...current.draft, cloudinaryVideo: video },
                    }))
                  }
                  onClearMeta={() =>
                    setLessonModal((current) => ({
                      ...current,
                      draft: { ...current.draft, cloudinaryVideo: null },
                    }))
                  }
                />
              ) : (
                <Field label="External video URL" hint="Public MP4/HLS link">
                  <Input
                    value={lessonModal.draft.externalUrl}
                    onChange={(event) =>
                      setLessonModal((current) => ({
                        ...current,
                        draft: { ...current.draft, externalUrl: event.target.value },
                      }))
                    }
                    placeholder="https://cdn.example.com/lesson.mp4"
                    icon={<Link2 className="h-4 w-4" />}
                  />
                </Field>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold">Learning resources</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setLessonModal((current) => ({
                    ...current,
                    draft: {
                      ...current.draft,
                      resources: [...current.draft.resources, { title: '', url: '' }],
                    },
                  }))
                }
                disabled={lessonModal.draft.resources.length >= 20}
              >
                <Plus className="h-3.5 w-3.5" />
                Add resource
              </Button>
            </div>
            {lessonModal.draft.resources.length === 0 ? (
              <p className="rounded-lg border border-dashed px-3 py-3 text-center text-[11px] text-muted-foreground">
                No resources yet. Add links to repositories, slides, or documentation.
              </p>
            ) : (
              <div className="space-y-2">
                {lessonModal.draft.resources.map((resource, index) => (
                  <div key={index} className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={resource.title}
                      onChange={(event) =>
                        setLessonModal((current) => {
                          const resources = [...current.draft.resources];
                          resources[index] = { ...resources[index], title: event.target.value };
                          return { ...current, draft: { ...current.draft, resources } };
                        })
                      }
                      placeholder="Resource title"
                      aria-label={`Resource ${index + 1} title`}
                    />
                    <Input
                      value={resource.url}
                      onChange={(event) =>
                        setLessonModal((current) => {
                          const resources = [...current.draft.resources];
                          resources[index] = { ...resources[index], url: event.target.value };
                          return { ...current, draft: { ...current.draft, resources } };
                        })
                      }
                      placeholder="https://…"
                      aria-label={`Resource ${index + 1} URL`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setLessonModal((current) => ({
                          ...current,
                          draft: {
                            ...current.draft,
                            resources: current.draft.resources.filter((_, i) => i !== index),
                          },
                        }))
                      }
                      aria-label="Remove resource"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(sectionToDelete)}
        onClose={() => setSectionToDelete(null)}
        onConfirm={async () => {
          if (!sectionToDelete) return;
          try {
            await deleteSectionMutation({ sectionId: sectionToDelete._id, courseId }).unwrap();
            toast.success('Section deleted');
            setSectionToDelete(null);
          } catch (error) {
            toast.error(
              (error as { data?: { message?: string } })?.data?.message ?? 'Could not delete section'
            );
          }
        }}
        title="Delete this section?"
        description={`“${sectionToDelete?.title ?? ''}” and its lessons will be removed. Student progress for those lessons is cleared.`}
        confirmLabel={deletingSection ? 'Deleting…' : 'Delete section'}
        destructive
      />

      <ConfirmDialog
        open={Boolean(lessonToDelete)}
        onClose={() => setLessonToDelete(null)}
        onConfirm={async () => {
          if (!lessonToDelete) return;
          try {
            await deleteLessonMutation({ lessonId: lessonToDelete._id, courseId }).unwrap();
            toast.success('Lesson deleted');
            setLessonToDelete(null);
          } catch (error) {
            toast.error(
              (error as { data?: { message?: string } })?.data?.message ?? 'Could not delete lesson'
            );
          }
        }}
        title="Delete this lesson?"
        description={`“${lessonToDelete?.title ?? ''}” will be removed from the curriculum.`}
        confirmLabel={deletingLesson ? 'Deleting…' : 'Delete lesson'}
        destructive
      />
    </section>
  );
}

function emptyLessonDraft(sectionId: string): LessonDraft {
  return {
    title: '',
    description: '',
    section: sectionId,
    durationMinutes: '',
    isPreview: false,
    videoMode: 'cloudinary',
    cloudinaryVideo: null,
    externalUrl: '',
    resources: [],
  };
}
