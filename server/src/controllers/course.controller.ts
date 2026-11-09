import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Course } from '../models/Course';
import { Category } from '../models/Category';
import { Section } from '../models/Section';
import { Lesson } from '../models/Lesson';
import { Enrollment } from '../models/Enrollment';
import { Order } from '../models/Order';
import { Review } from '../models/Review';
import { Question } from '../models/Question';
import { ApiError } from '../utils/ApiError';
import { asyncHandler, sendSuccess } from '../utils/response';
import { ensureUniqueSlug } from '../utils/slug';
import { parsePagination, paginationMeta } from '../utils/pagination';
import { cache, cacheKeys, invalidateCourseCaches } from '../config/redis';
import { env } from '../config/env';
import { deleteCloudinaryAsset, uploadImageBuffer } from '../config/cloudinary';
import { effectivePrice, recalculateCourseStats } from '../services/course.service';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSort(sort?: string): Record<string, 1 | -1> {
  switch (sort) {
    case 'oldest':
      return { createdAt: 1 };
    case 'price-asc':
      return { price: 1 };
    case 'price-desc':
      return { price: -1 };
    case 'popular':
      return { enrollmentCount: -1, createdAt: -1 };
    case 'rating':
      return { 'rating.average': -1, 'rating.count': -1 };
    case 'newest':
    default:
      return { createdAt: -1 };
  }
}

export const listCourses = asyncHandler(async (req: Request, res: Response) => {
  const { search, category, level, sort, featured } = req.query as {
    search?: string;
    category?: string;
    level?: string;
    sort?: string;
    featured?: string;
  };
  const pagination = parsePagination(req, 12);

  const filter: Record<string, unknown> = { status: 'published' };
  if (search) filter.title = new RegExp(escapeRegex(search), 'i');
  if (level) filter.level = level;
  if (featured === 'true') filter.featured = true;

  if (category && category !== 'all') {
    if (Types.ObjectId.isValid(category)) {
      filter.category = category;
    } else {
      const found = await Category.findOne({ slug: category }).select('_id').lean();
      if (!found) {
        sendSuccess(res, {
          items: [],
          meta: paginationMeta(0, pagination.page, pagination.limit),
        });
        return;
      }
      filter.category = found._id;
    }
  }

  const cacheKey = `${cacheKeys.courses}${JSON.stringify({
    search: search ?? '',
    category: category ?? '',
    level: level ?? '',
    sort: sort ?? 'newest',
    featured: featured ?? '',
    page: pagination.page,
    limit: pagination.limit,
  })}`;

  const cached = await cache.get<{ items: unknown[]; meta: unknown }>(cacheKey);
  if (cached) {
    sendSuccess(res, cached);
    return;
  }

  const [items, total] = await Promise.all([
    Course.find(filter)
      .populate('category', 'name slug')
      .select('-description -requirements -benefits -__v')
      .sort(buildSort(sort))
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    Course.countDocuments(filter),
  ]);

  const payload = {
    items: items.map((course) => ({ ...course, effectivePrice: effectivePrice(course) })),
    meta: paginationMeta(total, pagination.page, pagination.limit),
  };
  await cache.set(cacheKey, payload, 90);
  sendSuccess(res, payload);
});

export const getCourseBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const query = Types.ObjectId.isValid(slug) ? { $or: [{ slug }, { _id: slug }] } : { slug };

  const course = await Course.findOne(query)
    .populate('category', 'name slug description')
    .lean();

  if (!course) throw ApiError.notFound('Course not found', 'COURSE_NOT_FOUND');
  if (course.status !== 'published' && req.user?.role !== 'admin') {
    throw ApiError.notFound('Course not found', 'COURSE_NOT_FOUND');
  }

  const [sections, lessons] = await Promise.all([
    Section.find({ course: course._id }).sort('order').lean(),
    Lesson.find({ course: course._id })
      .sort('order')
      .select('section title duration order isPreview video.poster')
      .lean(),
  ]);

  const curriculum = sections.map((section) => ({
    ...section,
    lessons: lessons.filter((lesson) => String(lesson.section) === String(section._id)),
  }));

  let enrollment = null;
  if (req.user) {
    const found = await Enrollment.findOne({ user: req.user._id, course: course._id }).lean();
    if (found) {
      enrollment = {
        progress: found.progress,
        completedLessons: found.completedLessons,
        lastLesson: found.lastLesson,
        enrolledAt: found.enrolledAt,
      };
    }
  }

  sendSuccess(res, {
    course: { ...course, effectivePrice: effectivePrice(course) },
    curriculum,
    isEnrolled: Boolean(enrollment),
    enrollment,
  });
});

export const listAdminCourses = asyncHandler(async (req: Request, res: Response) => {
  const { search, status, level, category } = req.query as Record<string, string | undefined>;
  const pagination = parsePagination(req, 20);
  const filter: Record<string, unknown> = {};
  if (search) filter.title = new RegExp(escapeRegex(search), 'i');
  if (status && status !== 'all') filter.status = status;
  if (level && level !== 'all') filter.level = level;
  if (category && category !== 'all') filter.category = category;

  const [items, total] = await Promise.all([
    Course.find(filter)
      .populate('category', 'name slug')
      .select('-description -requirements -benefits')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    Course.countDocuments(filter),
  ]);

  sendSuccess(res, {
    items: items.map((course) => ({ ...course, effectivePrice: effectivePrice(course) })),
    meta: paginationMeta(total, pagination.page, pagination.limit),
  });
});

export const createCourse = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body;
  const category = await Category.findById(body.category).lean();
  if (!category) throw ApiError.badRequest('Selected category does not exist', 'CATEGORY_NOT_FOUND');

  if (body.discountPrice !== null && body.price > 0 && body.discountPrice >= body.price) {
    throw ApiError.badRequest('Discount price must be lower than the regular price', 'INVALID_PRICING');
  }

  const slug = await ensureUniqueSlug(Course, body.title);
  const course = await Course.create({
    ...body,
    slug,
    status: body.status ?? 'draft',
    publishedAt: body.status === 'published' ? new Date() : null,
  });

  await invalidateCourseCaches(course.slug);
  const populated = await course.populate('category', 'name slug');
  sendSuccess(res, { course: populated }, 'Course created', 201);
});

export const updateCourse = asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw ApiError.notFound('Course not found', 'COURSE_NOT_FOUND');

  const body = { ...req.body };
  if (body.category) {
    const category = await Category.findById(body.category).lean();
    if (!category) throw ApiError.badRequest('Selected category does not exist', 'CATEGORY_NOT_FOUND');
  }

  const oldSlug = course.slug;
  const nextPrice = body.price !== undefined ? Number(body.price) : course.price;
  const nextDiscount =
    body.discountPrice !== undefined ? body.discountPrice : course.discountPrice;
  if (nextDiscount !== null && nextPrice > 0 && nextDiscount >= nextPrice) {
    throw ApiError.badRequest('Discount price must be lower than the regular price', 'INVALID_PRICING');
  }

  if (body.title && body.title !== course.title) {
    body.slug = await ensureUniqueSlug(Course, body.title, course._id.toString());
  }
  if (body.status && body.status !== course.status) {
    body.publishedAt = body.status === 'published' ? new Date() : null;
  }

  Object.assign(course, body);
  await course.save();
  await invalidateCourseCaches(oldSlug);
  await invalidateCourseCaches(course.slug);
  const populated = await course.populate('category', 'name slug');
  sendSuccess(res, { course: populated }, 'Course updated');
});

export const deleteCourse = asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw ApiError.notFound('Course not found', 'COURSE_NOT_FOUND');

  const [enrollments, paidOrders] = await Promise.all([
    Enrollment.countDocuments({ course: course._id }),
    Order.countDocuments({ course: course._id, status: 'paid' }),
  ]);
  if (enrollments > 0 || paidOrders > 0) {
    throw ApiError.conflict(
      'This course has enrolled students or paid orders. Unpublish it instead of deleting so student records stay intact.',
      'COURSE_HAS_STUDENTS'
    );
  }

  await Promise.all([
    Section.deleteMany({ course: course._id }),
    Lesson.deleteMany({ course: course._id }),
    Review.deleteMany({ course: course._id }),
    Question.deleteMany({ course: course._id }),
    Enrollment.deleteMany({ course: course._id }),
  ]);
  await course.deleteOne();
  await invalidateCourseCaches(course.slug);
  sendSuccess(res, null, 'Course deleted');
});

export const setCourseStatus = asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw ApiError.notFound('Course not found', 'COURSE_NOT_FOUND');
  course.status = req.body.status;
  course.publishedAt = req.body.status === 'published' ? course.publishedAt ?? new Date() : null;
  await course.save();
  await invalidateCourseCaches(course.slug);
  sendSuccess(res, { course }, `Course ${course.status === 'published' ? 'published' : 'unpublished'}`);
});

export const uploadCourseThumbnail = asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw ApiError.notFound('Course not found', 'COURSE_NOT_FOUND');
  if (!req.file) throw ApiError.badRequest('No image file was provided', 'FILE_REQUIRED');

  let uploaded;
  try {
    uploaded = await uploadImageBuffer(req.file.buffer, `${env.CLOUDINARY_FOLDER}/courses`);
  } catch (error) {
    throw ApiError.serviceUnavailable(
      error instanceof Error ? error.message : 'Image hosting is not configured',
      'CLOUDINARY_UNAVAILABLE'
    );
  }

  const previous = course.thumbnail.publicId;
  course.thumbnail = { url: uploaded.secure_url, publicId: uploaded.public_id };
  await course.save();
  await deleteCloudinaryAsset(previous, 'image', 'upload');
  await invalidateCourseCaches(course.slug);
  sendSuccess(res, { course }, 'Thumbnail updated');
});

export const getCourseStats = asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findById(req.params.id).lean();
  if (!course) throw ApiError.notFound('Course not found', 'COURSE_NOT_FOUND');
  const [sections, lessons] = await Promise.all([
    Section.countDocuments({ course: course._id }),
    Lesson.countDocuments({ course: course._id }),
  ]);
  await recalculateCourseStats(course._id);
  sendSuccess(res, { sections, lessons });
});
