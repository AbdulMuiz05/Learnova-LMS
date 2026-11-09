import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Course } from '../models/Course';
import { Category } from '../models/Category';
import { Faq } from '../models/Faq';
import { Homepage } from '../models/Homepage';
import { SiteSettings } from '../models/SiteSettings';
import { Review } from '../models/Review';
import { User } from '../models/User';
import { Enrollment } from '../models/Enrollment';
import { cache, cacheKeys } from '../config/redis';
import { ApiError } from '../utils/ApiError';
import { asyncHandler, sendSuccess } from '../utils/response';
import { effectivePrice } from '../services/course.service';

const DEFAULT_HERO_IMAGE =
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80';

async function ensureHomepage() {
  const existing = await Homepage.findOne({ key: 'homepage' });
  if (existing) return existing;
  return Homepage.create({ key: 'homepage' });
}

export async function getSettingsDoc() {
  let settings = await SiteSettings.findOne({ key: 'site' });
  if (!settings) settings = await SiteSettings.create({ key: 'site' });
  return settings;
}

export const getHomepageData = asyncHandler(async (_req: Request, res: Response) => {
  const cached = await cache.get<unknown>(cacheKeys.homepage);
  if (cached) {
    sendSuccess(res, cached);
    return;
  }

  const layout = await ensureHomepage();
  const layoutObj = layout.toObject();

  const featuredQuery = layoutObj.featuredCourses.length
    ? { _id: { $in: layoutObj.featuredCourses }, status: 'published' as const }
    : { status: 'published' as const };

  const [featuredCourses, categories, faqs, totalStudents, totalCourses, totalEnrollments, ratingAgg, testimonials, totalLessons] =
    await Promise.all([
      Course.find(featuredQuery)
        .populate('category', 'name slug')
        .select('title slug thumbnail shortDescription level price discountPrice rating enrollmentCount totalDuration totalLessons instructor category')
        .sort({ featured: -1, enrollmentCount: -1, createdAt: -1 })
        .limit(6)
        .lean(),
      Category.find({ isActive: true }).sort({ order: 1 }).limit(8).lean(),
      Faq.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean(),
      User.countDocuments({ role: 'student' }),
      Course.countDocuments({ status: 'published' }),
      Enrollment.countDocuments(),
      Review.aggregate<{ avg: number }>([{ $group: { _id: null, avg: { $avg: '$rating' } } }]),
      Review.find({ rating: { $gte: 4 } })
        .populate('user', 'name avatar')
        .populate('course', 'title slug')
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
      Course.aggregate<{ total: number }>([
        { $match: { status: 'published' } },
        { $group: { _id: null, total: { $sum: '$totalLessons' } } },
      ]),
    ]);

  const categoryCounts = await Course.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { status: 'published' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(categoryCounts.map((row) => [String(row._id), row.count]));

  const hero = {
    ...layoutObj.hero,
    image: {
      ...layoutObj.hero.image,
      url: layoutObj.hero.image?.url || DEFAULT_HERO_IMAGE,
    },
  };

  const payload = {
    hero,
    benefits: layoutObj.benefits,
    featuredCourses: featuredCourses.map((course) => ({
      ...course,
      effectivePrice: effectivePrice(course),
    })),
    categories: categories
      .map((category) => ({ ...category, courseCount: countMap.get(String(category._id)) ?? 0 }))
      .filter((category) => category.courseCount > 0),
    faqs,
    testimonials,
    stats: {
      students: totalStudents,
      courses: totalCourses,
      enrollments: totalEnrollments,
      lessons: totalLessons[0]?.total ?? 0,
      averageRating: Math.round((ratingAgg[0]?.avg ?? 0) * 10) / 10,
    },
  };

  await cache.set(cacheKeys.homepage, payload, 120);
  sendSuccess(res, payload);
});

export const updateHomepage = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body;
  const homepage = await ensureHomepage();

  if (body.hero) {
    const current = homepage.hero;
    homepage.hero = {
      headline: body.hero.headline ?? current.headline,
      subheadline: body.hero.subheadline ?? current.subheadline,
      description: body.hero.description ?? current.description,
      badge: body.hero.badge ?? current.badge,
      image: {
        url: body.hero.image?.url ?? current.image?.url ?? '',
        publicId: body.hero.image?.publicId ?? current.image?.publicId ?? '',
      },
      primaryCta: {
        label: body.hero.primaryCta?.label ?? current.primaryCta?.label ?? 'Browse courses',
        href: body.hero.primaryCta?.href ?? current.primaryCta?.href ?? '/courses',
      },
      secondaryCta: {
        label: body.hero.secondaryCta?.label ?? current.secondaryCta?.label ?? 'Join for free',
        href: body.hero.secondaryCta?.href ?? current.secondaryCta?.href ?? '/register',
      },
    };
  }
  if (body.benefits) homepage.benefits = body.benefits;
  if (body.featuredCourses) {
    const valid = await Course.find({ _id: { $in: body.featuredCourses } }).select('_id').lean();
    homepage.featuredCourses = valid.map((course) => course._id);
  }

  await homepage.save();
  await cache.del(cacheKeys.homepage);
  sendSuccess(res, { homepage }, 'Homepage updated');
});

export const listPublicFaqs = asyncHandler(async (_req: Request, res: Response) => {
  const faqs = await Faq.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
  sendSuccess(res, { faqs });
});

export const listAllFaqs = asyncHandler(async (_req: Request, res: Response) => {
  const faqs = await Faq.find().sort({ order: 1, createdAt: 1 }).lean();
  sendSuccess(res, { faqs });
});

export const createFaq = asyncHandler(async (req: Request, res: Response) => {
  const faq = await Faq.create(req.body);
  await cache.del(cacheKeys.homepage);
  sendSuccess(res, { faq }, 'FAQ created', 201);
});

export const updateFaq = asyncHandler(async (req: Request, res: Response) => {
  const faq = await Faq.findById(req.params.faqId);
  if (!faq) throw ApiError.notFound('FAQ not found', 'FAQ_NOT_FOUND');
  Object.assign(faq, req.body);
  await faq.save();
  await cache.del(cacheKeys.homepage);
  sendSuccess(res, { faq }, 'FAQ updated');
});

export const deleteFaq = asyncHandler(async (req: Request, res: Response) => {
  const faq = await Faq.findById(req.params.faqId);
  if (!faq) throw ApiError.notFound('FAQ not found', 'FAQ_NOT_FOUND');
  await faq.deleteOne();
  await cache.del(cacheKeys.homepage);
  sendSuccess(res, null, 'FAQ deleted');
});

export const getPublicSettings = asyncHandler(async (_req: Request, res: Response) => {
  const cached = await cache.get<unknown>(cacheKeys.settings);
  if (cached) {
    sendSuccess(res, cached);
    return;
  }
  const settings = await getSettingsDoc();
  const payload = {
    siteName: settings.siteName,
    tagline: settings.tagline,
    supportEmail: settings.supportEmail,
    phone: settings.phone,
    address: settings.address,
    footerText: settings.footerText,
    currency: settings.currency,
    socials: settings.socials,
  };
  await cache.set(cacheKeys.settings, payload, 300);
  sendSuccess(res, payload);
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await getSettingsDoc();
  const body = req.body;
  if (body.socials) {
    settings.socials = { ...settings.socials, ...body.socials };
    delete body.socials;
  }
  Object.assign(settings, body);
  await settings.save();
  await cache.del(cacheKeys.settings);
  await cache.del(cacheKeys.homepage);
  sendSuccess(res, { settings }, 'Settings saved');
});

export const getAdminSiteContent = asyncHandler(async (_req: Request, res: Response) => {
  const [homepage, settings, faqs] = await Promise.all([
    ensureHomepage(),
    getSettingsDoc(),
    Faq.find().sort({ order: 1, createdAt: 1 }).lean(),
  ]);
  sendSuccess(res, { homepage, settings, faqs });
});
