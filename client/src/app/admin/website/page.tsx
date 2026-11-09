'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ExternalLink,
  GraduationCap,
  ImagePlus,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { DynamicIcon } from '@/components/dynamic-icon';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useGetAdminCoursesQuery } from '@/services/courseApi';
import { useGetAdminSiteContentQuery, useUpdateHomepageMutation } from '@/services/siteApi';
import { useUploadImageMutation } from '@/services/uploadApi';
import type { Benefit, HeroContent } from '@/types';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/format';

const BENEFIT_ICONS = [
  'Award',
  'BadgeCheck',
  'BarChart3',
  'BookOpen',
  'Brain',
  'Cloud',
  'Code2',
  'Cpu',
  'Database',
  'Globe',
  'GraduationCap',
  'Headphones',
  'Layers',
  'Megaphone',
  'MessagesSquare',
  'Rocket',
  'Server',
  'ShieldCheck',
  'Sparkles',
  'Target',
  'TrendingUp',
  'Users',
  'Zap',
];

interface HeroDraft extends Omit<HeroContent, 'image'> {
  imageUrl: string;
  imagePublicId: string;
}

export default function AdminWebsitePage() {
  const { data, isLoading, isError, refetch, isFetching } = useGetAdminSiteContentQuery();
  const [updateHomepage, { isLoading: saving }] = useUpdateHomepageMutation();
  const { data: coursesData } = useGetAdminCoursesQuery({ limit: 100, status: 'published' });
  const [uploadImage, { isLoading: uploading }] = useUploadImageMutation();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [hero, setHero] = React.useState<HeroDraft>({
    headline: '',
    subheadline: '',
    description: '',
    badge: '',
    imageUrl: '',
    imagePublicId: '',
    primaryCta: { label: '', href: '' },
    secondaryCta: { label: '', href: '' },
  });
  const [benefits, setBenefits] = React.useState<Benefit[]>([]);
  const [featured, setFeatured] = React.useState<string[]>([]);
  const [courseSearch, setCourseSearch] = React.useState('');
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    if (!data) return;
    const source = data.homepage.hero;
    setHero({
      headline: source.headline ?? '',
      subheadline: source.subheadline ?? '',
      description: source.description ?? '',
      badge: source.badge ?? '',
      imageUrl: source.image?.url ?? '',
      imagePublicId: source.image?.publicId ?? '',
      primaryCta: {
        label: source.primaryCta?.label ?? '',
        href: source.primaryCta?.href ?? '',
      },
      secondaryCta: {
        label: source.secondaryCta?.label ?? '',
        href: source.secondaryCta?.href ?? '',
      },
    });
    setBenefits(data.homepage.benefits ?? []);
    setFeatured((data.homepage.featuredCourses ?? []).map(String));
    setDirty(false);
  }, [data]);

  const markDirty = () => setDirty(true);

  const updateHero = <K extends keyof HeroDraft>(key: K, value: HeroDraft[K]) => {
    setHero((current) => ({ ...current, [key]: value }));
    markDirty();
  };

  const handleHeroImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5 MB.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', 'hero');
      const uploaded = await uploadImage({ formData }).unwrap();
      setHero((current) => ({
        ...current,
        imageUrl: uploaded.url,
        imagePublicId: uploaded.publicId,
      }));
      markDirty();
      toast.success('Hero image uploaded');
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ??
          'Upload failed. Add Cloudinary credentials or paste an image URL.'
      );
    }
  };

  const toggleFeatured = (courseId: string) => {
    setFeatured((current) => {
      if (current.includes(courseId)) return current.filter((id) => id !== courseId);
      if (current.length >= 12) {
        toast.error('You can feature up to 12 courses.');
        return current;
      }
      return [...current, courseId];
    });
    markDirty();
  };

  const save = async () => {
    if (hero.headline.trim().length < 5) {
      toast.error('The headline needs at least 5 characters.');
      return;
    }
    if (featured.length === 0) {
      toast.error('Select at least one featured course.');
      return;
    }
    try {
      await updateHomepage({
        hero: {
          headline: hero.headline.trim(),
          subheadline: hero.subheadline.trim(),
          description: hero.description.trim(),
          badge: hero.badge.trim(),
          image: { url: hero.imageUrl.trim(), publicId: hero.imagePublicId },
          primaryCta: {
            label: hero.primaryCta.label.trim() || 'Browse courses',
            href: hero.primaryCta.href.trim() || '/courses',
          },
          secondaryCta: {
            label: hero.secondaryCta.label.trim() || 'Join for free',
            href: hero.secondaryCta.href.trim() || '/register',
          },
        },
        benefits: benefits
          .map((benefit) => ({
            title: benefit.title.trim(),
            description: benefit.description.trim(),
            icon: benefit.icon || 'Award',
          }))
          .filter((benefit) => benefit.title && benefit.description),
        featuredCourses: featured,
      }).unwrap();
      toast.success('Homepage updated');
      setDirty(false);
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ?? 'Could not save homepage'
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={RefreshCcw}
        title="Website content could not load"
        description="The site content service did not respond."
        action={
          <Button onClick={() => refetch()} loading={isFetching}>
            <RefreshCcw className="h-4 w-4" />
            Retry
          </Button>
        }
      />
    );
  }

  const allCourses = coursesData?.items ?? [];
  const filteredCourses = allCourses.filter((course) =>
    course.title.toLowerCase().includes(courseSearch.trim().toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">
            <GraduationCap className="h-3.5 w-3.5 text-primary" />
            Website
          </span>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Homepage customization</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit the live storefront hero, benefits and featured courses. Last saved{' '}
            {data.homepage.updatedAt ? formatDate(data.homepage.updatedAt) : 'automatically'}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {dirty ? <Badge variant="warning">Unsaved changes</Badge> : null}
          <Link href="/" target="_blank" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            <ExternalLink className="h-4 w-4" />
            Preview site
          </Link>
          <Button onClick={save} loading={saving} size="sm">
            <Save className="h-4 w-4" />
            Save changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold">Hero section</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              The first thing visitors see. Keep the headline direct and outcome-focused.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold">Badge text</label>
                <Input
                  value={hero.badge}
                  onChange={(event) => updateHero('badge', event.target.value)}
                  className="mt-1.5"
                  placeholder="e.g. Learnova Fellowship"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Headline</label>
                <Input
                  value={hero.headline}
                  onChange={(event) => updateHero('headline', event.target.value)}
                  className="mt-1.5"
                  placeholder="Learn to build production software"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Subheadline</label>
                <Input
                  value={hero.subheadline}
                  onChange={(event) => updateHero('subheadline', event.target.value)}
                  className="mt-1.5"
                  placeholder="A short supporting line"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Description</label>
                <Textarea
                  value={hero.description}
                  onChange={(event) => updateHero('description', event.target.value)}
                  className="mt-1.5"
                  rows={3}
                  placeholder="Explain who the platform is for and the outcome students get."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border bg-muted/20 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Primary CTA
                  </p>
                  <Input
                    value={hero.primaryCta.label}
                    onChange={(event) =>
                      updateHero('primaryCta', { ...hero.primaryCta, label: event.target.value })
                    }
                    className="mt-2"
                    placeholder="Browse courses"
                  />
                  <Input
                    value={hero.primaryCta.href}
                    onChange={(event) =>
                      updateHero('primaryCta', { ...hero.primaryCta, href: event.target.value })
                    }
                    className="mt-2"
                    placeholder="/courses"
                  />
                </div>
                <div className="rounded-xl border bg-muted/20 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Secondary CTA
                  </p>
                  <Input
                    value={hero.secondaryCta.label}
                    onChange={(event) =>
                      updateHero('secondaryCta', { ...hero.secondaryCta, label: event.target.value })
                    }
                    className="mt-2"
                    placeholder="Join for free"
                  />
                  <Input
                    value={hero.secondaryCta.href}
                    onChange={(event) =>
                      updateHero('secondaryCta', { ...hero.secondaryCta, href: event.target.value })
                    }
                    className="mt-2"
                    placeholder="/register"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold">Benefits</h2>
                <p className="text-xs text-muted-foreground">Up to 8 value propositions shown on the homepage.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBenefits((current) => [
                    ...current,
                    { title: '', description: '', icon: 'Award' },
                  ]);
                  markDirty();
                }}
                disabled={benefits.length >= 8}
              >
                <Plus className="h-3.5 w-3.5" />
                Add benefit
              </Button>
            </div>

            {benefits.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                No benefits configured. Add one to populate this section.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="rounded-xl border bg-muted/20 p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <DynamicIcon name={benefit.icon} className="h-4 w-4" />
                      </span>
                      <Input
                        value={benefit.title}
                        onChange={(event) => {
                          const next = [...benefits];
                          next[index] = { ...next[index], title: event.target.value };
                          setBenefits(next);
                          markDirty();
                        }}
                        placeholder="Benefit title"
                        aria-label={`Benefit ${index + 1} title`}
                      />
                      <Select
                        value={benefit.icon || 'Award'}
                        onChange={(event) => {
                          const next = [...benefits];
                          next[index] = { ...next[index], icon: event.target.value };
                          setBenefits(next);
                          markDirty();
                        }}
                        className="w-36"
                        aria-label={`Benefit ${index + 1} icon`}
                      >
                        {BENEFIT_ICONS.map((icon) => (
                          <option key={icon} value={icon}>
                            {icon}
                          </option>
                        ))}
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setBenefits((current) => current.filter((_, i) => i !== index));
                          markDirty();
                        }}
                        aria-label="Remove benefit"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={benefit.description}
                      onChange={(event) => {
                        const next = [...benefits];
                        next[index] = { ...next[index], description: event.target.value };
                        setBenefits(next);
                        markDirty();
                      }}
                      className="mt-2"
                      rows={2}
                      maxLength={300}
                      placeholder="Short explanation of this benefit."
                      aria-label={`Benefit ${index + 1} description`}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold">Featured courses</h2>
                <p className="text-xs text-muted-foreground">
                  Choose up to 12 published courses · {featured.length} selected.
                </p>
              </div>
              <Input
                value={courseSearch}
                onChange={(event) => setCourseSearch(event.target.value)}
                placeholder="Filter courses…"
                icon={<Search className="h-4 w-4" />}
                className="sm:max-w-[220px]"
                aria-label="Filter courses"
              />
            </div>

            {filteredCourses.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                No published courses match this filter.
              </p>
            ) : (
              <div className="mt-4 grid max-h-[420px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {filteredCourses.map((course) => {
                  const selected = featured.includes(course._id);
                  return (
                    <button
                      key={course._id}
                      type="button"
                      onClick={() => toggleFeatured(course._id)}
                      className={cn(
                        'flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all',
                        selected
                          ? 'border-primary bg-primary/[0.05] shadow-sm'
                          : 'bg-card hover:border-primary/40'
                      )}
                    >
                      {course.thumbnail?.url ? (
                        <span className="relative h-10 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                          <Image
                            src={course.thumbnail.url}
                            alt={course.title}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </span>
                      ) : (
                        <span className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <GraduationCap className="h-4 w-4" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 text-xs font-semibold">{course.title}</span>
                        <span className="mt-0.5 block text-[10px] text-muted-foreground">
                          {course.enrollmentCount} students
                        </span>
                      </span>
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold',
                          selected ? 'border-primary bg-primary text-primary-foreground' : 'text-transparent'
                        )}
                      >
                        ✓
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-2xl border bg-card p-5 shadow-soft">
            <h2 className="text-sm font-bold">Hero image</h2>
            <div className="relative mt-3 aspect-[4/3] w-full overflow-hidden rounded-xl border bg-muted">
              {hero.imageUrl ? (
                <Image
                  src={hero.imageUrl}
                  alt="Hero preview"
                  fill
                  sizes="360px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1 text-muted-foreground">
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-[11px]">No hero image</span>
                </div>
              )}
              {uploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              ) : null}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleHeroImage(file);
              }}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                loading={uploading}
              >
                <ImagePlus className="h-4 w-4" />
                Upload image
              </Button>
              {hero.imageUrl ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    updateHero('imageUrl', '');
                    updateHero('imagePublicId', '');
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              ) : null}
            </div>
            <div className="mt-4">
              <label className="text-xs font-semibold">Or image URL</label>
              <Input
                value={hero.imageUrl}
                onChange={(event) => updateHero('imageUrl', event.target.value)}
                className="mt-1.5"
                placeholder="https://…"
              />
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-soft">
            <h2 className="text-sm font-bold">Live hero preview</h2>
            <div className="relative mt-3 overflow-hidden rounded-xl bg-slate-950 p-4 text-white">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/40 blur-2xl" />
              <div className="relative">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/60">
                  {hero.badge || 'Badge'}
                </p>
                <p className="mt-1.5 text-lg font-black leading-tight">
                  {hero.headline || 'Your headline appears here'}
                </p>
                <p className="mt-1 text-[11px] text-white/70">
                  {hero.subheadline || 'Supporting subheadline'}
                </p>
                <div className="mt-3 flex gap-1.5">
                  <span className="rounded-md bg-primary px-2 py-1 text-[9px] font-bold">
                    {hero.primaryCta.label || 'Browse courses'}
                  </span>
                  <span className="rounded-md border border-white/25 px-2 py-1 text-[9px] font-semibold">
                    {hero.secondaryCta.label || 'Join for free'}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Benefits and featured courses update on the storefront after saving. Homepage cache is
              invalidated on the server.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
